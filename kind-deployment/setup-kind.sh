#!/bin/bash

# This script is designed for non-interactive execution in a CI/CD environment.
set -e # Exit immediately if a command returns a non-zero status.

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

# Path for the special kubeconfig file.
KUBECONFIG_INTERNAL_PATH="${SCRIPT_DIR}/kubeconfig.internal"

# --- Functions ---

cleanup_and_create_cluster() {
  echo "--- Ensuring cluster '$CLUSTER_NAME' is in a clean state ---"
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Deleting existing cluster '$CLUSTER_NAME'..."
    kind delete cluster --name "$CLUSTER_NAME"
  fi
  echo "Creating new Kind cluster '$CLUSTER_NAME'..."
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"

  echo "Generating internal kubeconfig for container-to-cluster communication..."
  kind get kubeconfig --name "$CLUSTER_NAME" --internal > "${KUBECONFIG_INTERNAL_PATH}"
}

build_custom_images() {
  echo "--- Building custom service images ---"
  # This part is fast because of Docker's layer cache.
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    local FULL_IMAGE_NAME="${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}"
    echo "Building ${FULL_IMAGE_NAME} from ./${SERVICE_DIR}"
    docker build -t "${FULL_IMAGE_NAME}" "./${SERVICE_DIR}"
  done
}

# THIS STEP IS NOW SIGNIFICANTLY OPTIMIZED
load_images_to_kind() {
  echo "--- Loading all required images into Kind cluster '$CLUSTER_NAME' ---"
  local all_images=("${PUBLIC_IMAGES[@]}")
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    all_images+=("${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}")
  done
  # The 'kind load' command now takes a list, processing them in parallel which is much faster.
  kind load docker-image --name "$CLUSTER_NAME" "${all_images[@]}"
}

deploy_kubernetes_manifests() {
  # --- FINAL RELIABILITY IMPROVEMENT: WAIT FOR API SERVER ---
  echo "Waiting for Kubernetes API server to be ready..."
  export KUBECONFIG="${KUBECONFIG_INTERNAL_PATH}"
  
  # This loop attempts to connect every 5 seconds for up to 2 minutes.
  # This prevents the "connection refused" race condition.
  n=0
  until [ "$n" -ge 24 ]; do
    kubectl cluster-info && break
    n=$((n+1))
    echo "API server not ready, waiting 5 seconds..."
    sleep 5
  done
  if [ "$n" -ge 24 ]; then
    echo "Timed out waiting for Kubernetes API server."
    exit 1
  fi
  # -------------------------------------------------------------------

  echo "--- Rendering and deploying Kubernetes manifests ---"
  export IMAGE_PREFIX
  export IMAGE_TAG
  envsubst < "${KUBERNETES_MANIFEST_TEMPLATE_FILE}" > "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  echo "Rendered manifest to ${KUBERNETES_MANIFEST_RENDERED_FILE}"
  
  echo "Applying manifests..."
  kubectl apply -f "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  
  echo "--- Waiting for all deployments to become available... ---"
  kubectl wait --for=condition=Available --all deployments -n default --timeout=15m
}

print_access_info() {
  unset KUBECONFIG
  echo ""
  echo "--- DEPLOYMENT SUCCEEDED ---"
  echo "All services are running inside your Kind cluster."
  echo "API Gateway should be accessible at: http://localhost:13000"
  echo "Consul UI: http://localhost:18500"
  echo "To delete the cluster, run: kind delete cluster --name ${CLUSTER_NAME}"
}

# --- Main Execution ---
cleanup_and_create_cluster
build_custom_images
load_images_to_kind
deploy_kubernetes_manifests
print_access_info