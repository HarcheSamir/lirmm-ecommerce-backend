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
)
KIND_IMAGE_TAG="kind"
CLUSTER_NAME="lirmm-dev-cluster"

PUBLIC_IMAGES=(
  "postgres:15-alpine"
  "confluentinc/cp-zookeeper:7.3.2"
  "confluentinc/cp-kafka:7.3.2"
  "docker.elastic.co/elasticsearch/elasticsearch:8.11.1"
  "hashicorp/consul:1.18"
)

KUBERNETES_MANIFEST_FILE="./kind-deployment/kubernetes-manifests.yaml"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"

# --- Functions ---
cleanup_cluster() {
  echo "--- Checking for existing Kind cluster: $CLUSTER_NAME ---"
  if [[ $(kind get clusters | grep "^${CLUSTER_NAME}$") ]]; then
    echo "Cluster '$CLUSTER_NAME' already exists. Deleting..."
    kind delete cluster --name "$CLUSTER_NAME"
    echo "Cluster '$CLUSTER_NAME' deleted."
  fi
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
  echo "--- Building Docker images for custom services ---"
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    local IMAGE_NAME_NO_TAG="$SERVICE_DIR"
    local FULL_IMAGE_NAME="${IMAGE_NAME_NO_TAG}:${KIND_IMAGE_TAG}"
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
  echo "--- Creating Kind cluster '$CLUSTER_NAME' with port mappings ---"
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
    local IMAGE_NAME_NO_TAG="$SERVICE_DIR"
    local FULL_IMAGE_NAME="${IMAGE_NAME_NO_TAG}:${KIND_IMAGE_TAG}"
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
      # This could happen if 'docker pull' failed silently or the image name is subtly different.
      exit 1
    fi
  done
}

deploy_kubernetes_manifests() {
  echo ""
  echo "--- Deploying Kubernetes manifests ---"
  kubectl apply -f "${KUBERNETES_MANIFEST_FILE}"
  if [ $? -ne 0 ]; then
    echo "ERROR: kubectl apply failed. Check output above for specific errors."
    exit 1
  fi
}

print_access_info() {
echo ""
echo "--- Deployment complete! ---"
echo "Wait for all pods to be in the 'Running' and 'READY' state (e.g., 1/1)."
echo "You can check status with: kubectl get pods -A -w"
echo ""
echo "Access services on localhost with the new ports:"
echo "API Gateway:     http://localhost:13000"
echo "Auth Service:    http://localhost:13001 (if it has direct HTTP routes)"
echo "Product Service: http://localhost:13003 (if it has direct HTTP routes)"
echo "Image Service:   http://localhost:13004 (IMAGE_BASE_URL configured to this)"
echo "Search Service:  http://localhost:13005 (if it has direct HTTP routes)"
echo "Consul UI:       http://localhost:18500"
echo "Elasticsearch:   http://localhost:19200"
echo "Kafka (External):localhost:39092"
echo "Auth DB:         localhost:15434 (user: postgres, pass: postgres, db: auth_db)"
echo "Product DB:      localhost:15435 (user: postgres, pass: postgres, db: product_db)"
echo ""
echo "To delete the cluster: kind delete cluster --name ${CLUSTER_NAME}"
}

# --- Main Execution ---
cleanup_cluster
pull_public_images        # Step 1: Pull public images to host
build_custom_images       # Step 2: Build your service images
create_kind_cluster       # Step 3: Create the Kind cluster
load_images_to_kind       # Step 4: Load ALL images (custom and public) into Kind
deploy_kubernetes_manifests # Step 5: Deploy your application
print_access_info

# Return to original directory (optional)
cd "$SCRIPT_DIR"