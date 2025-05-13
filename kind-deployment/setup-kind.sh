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
  "cart-service" # <-- ADDED cart-service
)
# For setup-kind.sh, we use a specific tag that kubernetes-manifests.yaml might expect
# if it wasn't parameterized for Jenkins (here, it is, so this is less critical
# but good for local consistency if not using Jenkins substitutions)
KIND_IMAGE_TAG="latest" # or 'dev', or a fixed version
CLUSTER_NAME="lirmm-dev-cluster" # Default cluster name for local dev

PUBLIC_IMAGES=(
  "postgres:15-alpine"
  "confluentinc/cp-zookeeper:7.3.2"
  "confluentinc/cp-kafka:7.3.2"
  "docker.elastic.co/elasticsearch/elasticsearch:8.11.1"
  "hashicorp/consul:1.18"
  "redis:7.2-alpine" # <-- ADDED redis
)

# The setup-kind.sh will use fixed image tags ('latest' or 'dev') for custom services for local build simplicity.
# Jenkinsfile handles dynamic IMAGE_TAG.
# We use a non-parameterized KUBERNETES_MANIFEST_FILE and substitute fixed tags manually.

KUBERNETES_MANIFEST_TEMPLATE_FILE="./kind-deployment/kubernetes-manifests.yaml" # This IS the template
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
      # Optional: try to load images even if cluster exists, or skip this stage too.
      return # Exit function if not recreating
    fi
  fi
  create_kind_cluster # Only create if deleted or didn't exist
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
    # Image name for custom services will be "library/servicename:tag" for consistency with Jenkins,
    # though for local Kind, "servicename:tag" is also fine. We'll use IMAGE_PREFIX from env if set, else 'library'.
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
  # Load custom images
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
  # Load public images
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

  # For local setup, substitute with the fixed local tag
  export IMAGE_PREFIX="${IMAGE_PREFIX:-library}" # Use 'library' if IMAGE_PREFIX not set in env
  export IMAGE_TAG="${KIND_IMAGE_TAG}"
  envsubst < "${KUBERNETES_MANIFEST_TEMPLATE_FILE}" > "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  echo "Rendered manifest saved to ${KUBERNETES_MANIFEST_RENDERED_FILE}"


  kubectl apply -f "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  if [ $? -ne 0 ]; then
    echo "ERROR: kubectl apply failed. Check output above for specific errors."
    # exit 1 # Commenting out exit to allow observation
  fi

  echo "--- Waiting for deployments to stabilize (this may take several minutes)... ---"
  # Simplified wait logic for local script. Jenkinsfile has more robust rollout status.
  # You might want to check DEPLOYMENT_NAMES array similar to Jenkinsfile for robustness
  sleep 10 # Initial grace period
  kubectl get pods -A -w
}

print_access_info() {
echo ""
echo "--- Deployment attempt complete! ---"
echo "Monitor pod status with: kubectl get pods -A -w"
echo "Once all pods are Running and Ready (e.g., 1/1), access services:"
echo ""
echo "Common Services:"
echo "API Gateway:       <http://localhost:13000>"
echo "Consul UI:         <http://localhost:18500>"
echo "Elasticsearch:     <http://localhost:19200>"
echo "Kafka (External):  localhost:39092"
echo "Redis (External):    localhost:19379 (if mapped in kind-cluster-config, from nodePort 32379)"
echo ""
echo "Individual Service NodePorts (if direct access needed/configured):"
echo "Auth Service:      <http://localhost:13001> (NodePort 30001)"
echo "Product Service:   <http://localhost:13003> (NodePort 30003)"
echo "Image Service:     <http://localhost:13004> (NodePort 30004) -> IMAGE_BASE_URL is this"
echo "Search Service:    <http://localhost:13005> (NodePort 30005)"
echo "Cart Service:      <http://localhost:13006> (NodePort 30006)" # <-- ADDED
echo ""
echo "Databases (via NodePorts):"
echo "Auth DB (pg):      localhost:15434 (User: postgres, Pass: postgres, DB: auth_db)"
echo "Product DB (pg):   localhost:15435 (User: postgres, Pass: postgres, DB: product_db)"
echo ""
echo "To delete the cluster: kind delete cluster --name ${CLUSTER_NAME}"
echo "To remove rendered manifest: rm -f ${KUBERNETES_MANIFEST_RENDERED_FILE}"
}

# --- Main Execution ---
cleanup_cluster           # Step 0: Ask to clean/create cluster
pull_public_images        # Step 1: Pull public images to host
build_custom_images       # Step 2: Build your service images (uses local tag)
# create_kind_cluster is called by cleanup_cluster if needed
load_images_to_kind       # Step 4: Load ALL images into Kind
deploy_kubernetes_manifests # Step 5: Deploy your application (uses local tag substitution)
print_access_info

# Return to original directory (optional, if SCRIPT_DIR was different from initial cd)
# cd "$SCRIPT_DIR"
