#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# --- Configuration ---
: "${CLUSTER_NAME:="lirmm-dev-cluster"}"
: "${IMAGE_TAG:="latest"}"
: "${IMAGE_PREFIX:="lirmm-ecommerce"}"

CUSTOM_SERVICES=(
  "api-gateway" "auth-service" "product-service" "image-service"
  "search-service" "cart-service" "order-service" "review-service"
)

PUBLIC_IMAGES=(
  "postgres:15-alpine" "confluentinc/cp-zookeeper:7.3.2" "confluentinc/cp-kafka:7.3.2"
  "docker.elastic.co/elasticsearch/elasticsearch:8.11.1" "hashicorp/consul:1.18" "redis:7.2-alpine"
)

KUBERNETES_MANIFEST_TEMPLATE_FILE="./kind-deployment/kubernetes-manifests.yaml"
KUBERNETES_MANIFEST_RENDERED_FILE="./kind-deployment/kubernetes-manifests-rendered.yaml"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"

# --- Functions ---
cleanup_and_create_cluster() {
  echo "--- Ensuring cluster '$CLUSTER_NAME' is in a clean state ---"
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Deleting existing cluster '$CLUSTER_NAME'..."
    kind delete cluster --name "$CLUSTER_NAME"
  fi
  echo "Creating new Kind cluster '$CLUSTER_NAME' from ${KIND_CONFIG_FILE}..."
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"
}

pull_public_images() {
  echo "--- Pulling public Docker images ---"
  for IMAGE_NAME in "${PUBLIC_IMAGES[@]}"; do
    echo "Pulling ${IMAGE_NAME}..."
    docker pull "${IMAGE_NAME}"
  done
}

build_custom_images() {
  echo "--- Building custom service images with tag '${IMAGE_PREFIX}/${IMAGE_TAG}' ---"
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    FULL_IMAGE_NAME="${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}"
    echo "Building ${FULL_IMAGE_NAME} from ./${SERVICE_DIR}"
    docker build -t "${FULL_IMAGE_NAME}" "./${SERVICE_DIR}"
  done
}

load_images_to_kind() {
  echo "--- Loading all required images into Kind cluster '$CLUSTER_NAME' ---"
  ALL_IMAGES=("${PUBLIC_IMAGES[@]}")
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    ALL_IMAGES+=("${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}")
  done

  for IMAGE_NAME in "${ALL_IMAGES[@]}"; do
    echo "Loading: ${IMAGE_NAME}"
    kind load docker-image "${IMAGE_NAME}" --name "$CLUSTER_NAME"
  done
}

deploy_kubernetes_manifests() {
  echo "--- Rendering and deploying Kubernetes manifests ---"
  export IMAGE_PREFIX
  export IMAGE_TAG
  envsubst < "${KUBERNETES_MANIFEST_TEMPLATE_FILE}" > "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  echo "Rendered manifest to ${KUBERNETES_MANIFEST_RENDERED_FILE}"
  kubectl apply -f "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  echo "--- Waiting for deployments to initialize (this can take several minutes)... ---"
  kubectl wait --for=condition=Available --all deployments -n default --timeout=10m
}

print_access_info() {
  echo ""
  echo "--- DEPLOYMENT SUCCEEDED ---"
  echo "All services are running inside your Kind cluster."
  echo "API Gateway should be accessible at: http://localhost:13000"
  echo "Consul UI: http://localhost:18500"
  echo "To delete the cluster, run: kind delete cluster --name ${CLUSTER_NAME}"
}

# --- Main Execution ---
cleanup_and_create_cluster
pull_public_images
build_custom_images
load_images_to_kind
deploy_kubernetes_manifests
print_access_info