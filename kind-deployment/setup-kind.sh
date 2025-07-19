#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
IMAGE_PREFIX="lirmm-ecommerce"
MANUAL_IMAGE_TAG="latest" # Default tag for manual runs. Jenkins provides its own.
SERVICES=('api-gateway' 'auth-service' 'product-service' 'image-service' 'search-service' 'cart-service' 'order-service' 'review-service')
PUBLIC_IMAGES=('postgres:15-alpine' 'confluentinc/cp-zookeeper:7.3.2' 'confluentinc/cp-kafka:7.3.2' 'docker.elastic.co/elasticsearch/elasticsearch:8.11.1' 'hashicorp/consul:1.18' 'redis:7.2-alpine')
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"

# Jenkins injects BUILD_NUMBER, which we use for a unique IMAGE_TAG.
# We fall back to the manual tag if BUILD_NUMBER is not set.
FINAL_IMAGE_TAG="build-${BUILD_NUMBER:-$MANUAL_IMAGE_TAG}"

# --- Reusable Functions ---

create_cluster() {
    echo "--- Creating Kind cluster: ${CLUSTER_NAME} ---"
    # Clean up any old cluster first.
    kind delete cluster --name "${CLUSTER_NAME}" || true
    # Create the cluster using the fixed config file with the etcd timeout.
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

build_images() {
    echo "--- Building custom service images with tag: ${FINAL_IMAGE_TAG} ---"
    for SERVICE in "${SERVICES[@]}"; do
        echo "Building ${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG} from ./${SERVICE}"
        # This will be fast on subsequent runs due to Docker layer caching.
        docker build -t "${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG}" "./${SERVICE}"
    done
}

load_images() {
    echo "--- Loading all images into Kind cluster (this will take a while) ---"
    local all_images=("${PUBLIC_IMAGES[@]}")
    for SERVICE in "${SERVICES[@]}"; do
        all_images+=("${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG}")
    done
    # Use the optimized parallel load command.
    kind load docker-image --name "${CLUSTER_NAME}" "${all_images[@]}"
}

# --- Command Line Argument Parsing for Jenkins ---

case "$1" in
    create_cluster)
        create_cluster
        ;;
    build_images)
        build_images
        ;;
    load_images)
        load_images
        ;;
    *)
        echo "Usage for Jenkins: $0 {create_cluster|build_images|load_images}"
        echo "For a manual run, no arguments are needed."
        # Full sequence for a developer to run manually
        create_cluster
        build_images
        load_images
        echo "--- Manual run complete. The cluster is up and loaded with images. ---"
        ;;
esac