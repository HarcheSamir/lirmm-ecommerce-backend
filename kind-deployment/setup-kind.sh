#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.." # Move to the parent directory (backend/)

# --- Configuration ---
CUSTOM_SERVICES=(
  "api-gateway"
  "auth-service"
  "product-service"
  "image-service"
  "search-service"
  "cart-service"
  "order-service"
  "review-service"
)
KIND_IMAGE_TAG="latest"
CLUSTER_NAME="lirmm-dev-cluster"

PUBLIC_IMAGES=(
  "postgres:15-alpine"
  "confluentinc/cp-zookeeper:7.3.2"
  "confluentinc/cp-kafka:7.3.2"
  "docker.elastic.co/elasticsearch/elasticsearch:8.11.1"
  "hashicorp/consul:1.18"
  "redis:7.2-alpine"
)

KUBERNETES_MANIFEST_TEMPLATE_FILE="./kind-deployment/kubernetes-manifests.yaml"
KUBERNETES_MANIFEST_RENDERED_FILE="./kind-deployment/kubernetes-manifests-rendered-local.yaml"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"

# <-- NEW: Istio Version -->
ISTIO_VERSION="1.22.1" # Using a recent, stable version of Istio

# --- Functions ---

# <-- NEW: Function to setup Istio CLI -->
setup_istio_cli() {
  if [ ! -d "istio-${ISTIO_VERSION}" ]; then
    echo "--- Setting up Istio CLI (istioctl) version ${ISTIO_VERSION} ---"
    curl -L https://istio.io/downloadIstio | ISTIO_VERSION=${ISTIO_VERSION} sh -
    if [ $? -ne 0 ]; then
      echo "ERROR: Failed to download Istio. Exiting."
      exit 1
    fi
  else
    echo "--- Istio ${ISTIO_VERSION} directory already exists, skipping download. ---"
  fi
  # Add istioctl to this script's PATH
  export PATH="$PWD/istio-${ISTIO_VERSION}/bin:$PATH"
  echo "istioctl path set for this session."
}

cleanup_cluster() {
  echo "--- Checking for existing Kind cluster: $CLUSTER_NAME ---"
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    read -p "Cluster '$CLUSTER_NAME' already exists. Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "Deleting cluster '$CLUSTER_NAME'..."
      kind delete cluster --name "$CLUSTER_NAME"
      echo "Cluster '$CLUSTER_NAME' deleted."
      create_kind_cluster
    else
      echo "Skipping cluster recreation. Attempting to deploy to existing cluster."
    fi
  else
    create_kind_cluster
  fi
}

create_kind_cluster() {
  echo ""
  echo "--- Creating Kind cluster '$CLUSTER_NAME' with config from ${KIND_CONFIG_FILE} ---"
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"
  if [ $? -ne 0 ]; then
    echo "ERROR: Kind cluster creation failed. Exiting."
    exit 1
  fi
}

# <-- NEW: Function to install Istio and addons -->
install_istio() {
  echo ""
  echo "--- Installing Istio onto cluster '$CLUSTER_NAME' ---"
  istioctl install --set profile=demo -y
  if [ $? -ne 0 ]; then
    echo "ERROR: Istio installation failed. Exiting."
    exit 1
  fi

  echo "--- Enabling Istio automatic sidecar injection on the 'default' namespace ---"
  kubectl label namespace default istio-injection=enabled --overwrite

  echo "--- Deploying Istio's Prometheus, Grafana, and Kiali addons ---"
  kubectl apply -f "istio-${ISTIO_VERSION}/samples/addons/prometheus.yaml"
  kubectl apply -f "istio-${ISTIO_VERSION}/samples/addons/grafana.yaml"
  kubectl apply -f "istio-${ISTIO_VERSION}/samples/addons/kiali.yaml"
  echo "Waiting for Istio addons to be created..."
  sleep 15 # Give addons time to be created before checking status
}

pull_public_images() {
  echo ""
  echo "--- Pulling public Docker images to host ---"
  for IMAGE_NAME in "${PUBLIC_IMAGES[@]}"; do
    echo "Pulling ${IMAGE_NAME}..."
    docker pull "${IMAGE_NAME}"
    if [ $? -ne 0 ]; then
      echo "ERROR: Docker pull failed for ${IMAGE_NAME}. Please check Docker Hub access and image name. Exiting."
      exit 1
    fi
  done
}

build_custom_images() {
  echo ""
  echo "--- Building Docker images for custom services with tag '${KIND_IMAGE_TAG}' ---"
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    local IMAGE_PREFIX_LOCAL="${IMAGE_PREFIX:-library}"
    local FULL_IMAGE_NAME="${IMAGE_PREFIX_LOCAL}/${SERVICE_DIR}:${KIND_IMAGE_TAG}"
    echo "Building ${FULL_IMAGE_NAME} from ./${SERVICE_DIR}"
    if [ -f "./${SERVICE_DIR}/Dockerfile" ]; then
      docker build -t "${FULL_IMAGE_NAME}" "./${SERVICE_DIR}"
      if [ $? -ne 0 ]; then
        echo "ERROR: Docker build failed for ${FULL_IMAGE_NAME}. Exiting."
        exit 1
      fi
    else
      echo "ERROR: Dockerfile not found in ./${SERVICE_DIR}. Exiting."
      exit 1
    fi
  done
}

load_images_to_kind() {
  echo ""
  echo "--- Loading ALL Docker images into Kind cluster '$CLUSTER_NAME' ---"
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    local IMAGE_PREFIX_LOCAL="${IMAGE_PREFIX:-library}"
    local FULL_IMAGE_NAME="${IMAGE_PREFIX_LOCAL}/${SERVICE_DIR}:${KIND_IMAGE_TAG}"
    echo "Loading custom image ${FULL_IMAGE_NAME} into cluster '$CLUSTER_NAME'"
    kind load docker-image "${FULL_IMAGE_NAME}" --name "$CLUSTER_NAME"
    if [ $? -ne 0 ]; then
      echo "ERROR: Failed to load image ${FULL_IMAGE_NAME} into Kind. Exiting."
      exit 1
    fi
  done
  for IMAGE_NAME in "${PUBLIC_IMAGES[@]}"; do
    echo "Loading public image ${IMAGE_NAME} into cluster '$CLUSTER_NAME'"
    kind load docker-image "${IMAGE_NAME}" --name "$CLUSTER_NAME"
    if [ $? -ne 0 ]; then
      echo "ERROR: Failed to load image ${IMAGE_NAME} into Kind. Exiting."
      exit 1
    fi
  done
}

deploy_kubernetes_manifests() {
  echo ""
  echo "--- Rendering and Deploying Kubernetes manifests ---"

  export IMAGE_PREFIX="${IMAGE_PREFIX:-library}"
  export IMAGE_TAG="${KIND_IMAGE_TAG}"
  envsubst < "${KUBERNETES_MANIFEST_TEMPLATE_FILE}" > "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  echo "Rendered manifest saved to ${KUBERNETES_MANIFEST_RENDERED_FILE}"

  kubectl apply -f "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  if [ $? -ne 0 ]; then
    echo "ERROR: kubectl apply failed. Check output above for specific errors."
  fi

  echo "--- Waiting for deployments to stabilize (this may take several minutes)... ---"
  kubectl get pods -A -w
}

print_access_info() {
  # <-- MODIFIED: Updated access info for Istio -->
  echo ""
  echo "--- Deployment attempt complete! ---"
  echo "Monitor pod status with: kubectl get pods -A -w"
  echo "All application pods should show '2/2' containers Running (app + istio-proxy)."
  echo ""
  echo "--- Application Access ---"
  echo "The primary entry point is now the Istio Ingress Gateway."
  echo "Application URL:   http://localhost:13000  (e.g., http://localhost:13000/products)"
  echo ""
  echo "--- Observability Tools (use kubectl port-forward in a new terminal) ---"
  echo "Grafana:           (run: kubectl port-forward svc/grafana -n istio-system 3000:3000) -> Access at http://localhost:3000"
  echo "Prometheus:        (run: kubectl port-forward svc/prometheus -n istio-system 9090:9090) -> Access at http://localhost:9090"
  echo "Kiali (Topology):  (run: kubectl port-forward svc/kiali -n istio-system 20001:20001) -> Access at http://localhost:20001 (user: admin, pass: admin)"
  echo ""
  echo "--- Direct Infrastructure Access ---"
  echo "Consul UI:         http://localhost:18500"
  echo "Kafka (External):  localhost:39092"
  echo "Elasticsearch:     http://localhost:19200"
  echo "Redis:             localhost:19379"
  echo "Auth DB (pg):      localhost:15434"
  echo "Product DB (pg):   localhost:15435"
  echo "Order DB (pg):     localhost:15436"
  echo "Review DB (pg):    localhost:15437"
  echo ""
  echo "To delete the cluster: kind delete cluster --name ${CLUSTER_NAME}"
  echo "To remove rendered manifest: rm -f ${KUBERNETES_MANIFEST_RENDERED_FILE}"
}

# --- Main Execution (Reordered) ---
setup_istio_cli           # Step 0: Ensure istioctl is available
cleanup_cluster           # Step 1: Ask to clean/create cluster
pull_public_images        # Step 2: Pull public images to host
build_custom_images       # Step 3: Build your service images
load_images_to_kind       # Step 4: Load ALL images into Kind
install_istio             # Step 5: <-- NEW --> Install Istio and addons
deploy_kubernetes_manifests # Step 6: Deploy your application
print_access_info         # Step 7: Show updated access info