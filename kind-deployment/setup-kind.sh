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

# --- Functions ---
cleanup_cluster() {
  echo "--- Checking for existing Kind cluster: $CLUSTER_NAME ---"
  if [[ $(kind get clusters | grep -q "^${CLUSTER_NAME}$") ]]; then
    read -p "Cluster '$CLUSTER_NAME' already exists. Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "Deleting cluster '$CLUSTER_NAME'..."
      kind delete cluster --name "$CLUSTER_NAME"
      echo "Cluster '$CLUSTER_NAME' deleted."
    else
      echo "Skipping cluster recreation. Attempting to deploy to existing cluster."
      return
    fi
  fi
  create_kind_cluster
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

create_kind_cluster() {
  echo ""
  echo "--- Creating Kind cluster '$CLUSTER_NAME' with config from ${KIND_CONFIG_FILE} ---"
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"
  if [ $? -ne 0 ]; then
    echo "ERROR: Kind cluster creation failed. Exiting."
    exit 1
  fi
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
  sleep 10
  kubectl get pods -A -w
}

print_access_info() {
echo ""
echo "--- Deployment attempt complete! ---"
echo "Monitor pod status with: kubectl get pods -A -w"
echo "Once all pods are Running and Ready (e.g., 1/1), access services:"
echo ""
echo "Common Services:"
echo "API Gateway:       http://localhost:13000"
echo "Consul UI:         http://localhost:18500"
echo "Elasticsearch:     http://localhost:19200"
echo "Kafka (External):  localhost:39092"
echo "Redis (External):  localhost:19379"
echo ""
echo "Individual Service NodePorts (if direct access needed/configured):"
echo "Auth Service:      http://localhost:13001 (NodePort 30001)"
echo "Product Service:   http://localhost:13003 (NodePort 30003)"
echo "Image Service:     http://localhost:13004 (NodePort 30004)"
echo "Search Service:    http://localhost:13005 (NodePort 30005)"
echo "Cart Service:      http://localhost:13006 (NodePort 30006)"
echo "Order Service:     http://localhost:13007 (NodePort 30007)"
echo ""
echo "Databases (via NodePorts):"
echo "Auth DB (pg):      localhost:15434 (User: postgres, Pass: postgres, DB: auth_db)"
echo "Product DB (pg):   localhost:15435 (User: postgres, Pass: postgres, DB: product_db)"
echo "Order DB (pg):     localhost:15436 (User: postgres, Pass: postgres, DB: order_db)"
echo "Review DB (pg):    localhost:15437 (User: postgres, Pass: postgres, DB: review_db)"
echo ""
echo "To delete the cluster: kind delete cluster --name ${CLUSTER_NAME}"
echo "To remove rendered manifest: rm -f ${KUBERNETES_MANIFEST_RENDERED_FILE}"
}

# --- Main Execution ---
cleanup_cluster
pull_public_images
build_custom_images
load_images_to_kind
deploy_kubernetes_manifests
print_access_info