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

# ========================= THE DEFINITIVE FIX IS HERE =========================
# This is the path to the special kubeconfig file we will generate.
KUBECONFIG_INTERNAL_PATH="${SCRIPT_DIR}/kubeconfig.internal"
# ==============================================================================

cleanup_and_create_cluster() {
  echo "--- Ensuring cluster '$CLUSTER_NAME' is in a clean state ---"
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Deleting existing cluster '$CLUSTER_NAME'..."
    kind delete cluster --name "$CLUSTER_NAME"
  fi
  echo "Creating new Kind cluster '$CLUSTER_NAME' from ${KIND_CONFIG_FILE}..."
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"

  # --- GENERATE THE INTERNAL KUBECONFIG ---
  # This command gets a kubeconfig that uses the internal Docker network IP
  # of the control plane, making it accessible from the Jenkins container.
  echo "Generating internal kubeconfig for container-to-cluster communication..."
  kind get kubeconfig --name "$CLUSTER_NAME" --internal > "${KUBECONFIG_INTERNAL_PATH}"
}

build_custom_images() {
  echo "--- Building custom service images with tag '${IMAGE_PREFIX}/${IMAGE_TAG}' ---"
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    local FULL_IMAGE_NAME="${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}"
    echo "Building ${FULL_IMAGE_NAME} from ./${SERVICE_DIR}"
    docker build -t "${FULL_IMAGE_NAME}" "./${SERVICE_DIR}"
  done
}

load_images_to_kind() {
  echo "--- Loading all required images into Kind cluster '$CLUSTER_NAME' ---"
  local all_images=("${PUBLIC_IMAGES[@]}")
  for SERVICE_DIR in "${CUSTOM_SERVICES[@]}"; do
    all_images+=("${IMAGE_PREFIX}/${SERVICE_DIR}:${IMAGE_TAG}")
  done
  for IMAGE_NAME in "${all_images[@]}"; do
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

  # --- USE THE INTERNAL KUBECONFIG ---
  # By setting the KUBECONFIG environment variable, we force kubectl to use
  # our special config file for all subsequent commands.
  export KUBECONFIG="${KUBECONFIG_INTERNAL_PATH}"
  
  echo "Applying manifests using internal kubeconfig..."
  kubectl apply -f "${KUBERNETES_MANIFEST_RENDERED_FILE}"
  
  echo "--- Waiting for all deployments to become available... ---"
  kubectl wait --for=condition=Available --all deployments -n default --timeout=15m
}

print_access_info() {
  # --- UNSET THE INTERNAL KUBECONFIG ---
  # Clean up the environment variable so it doesn't affect other processes.
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