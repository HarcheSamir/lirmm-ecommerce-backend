#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
IMAGE_PREFIX="lirmm-ecommerce"
MANUAL_IMAGE_TAG="latest"
SERVICES=('api-gateway' 'auth-service' 'product-service' 'image-service' 'search-service' 'cart-service' 'order-service' 'review-service')
PUBLIC_IMAGES=('postgres:15-alpine' 'confluentinc/cp-zookeeper:7.3.2' 'confluentinc/cp-kafka:7.3.2' 'docker.elastic.co/elasticsearch/elasticsearch:8.11.1' 'hashicorp/consul:1.18' 'redis:7.2-alpine')
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
FINAL_IMAGE_TAG="build-${BUILD_NUMBER:-$MANUAL_IMAGE_TAG}"

# --- Reusable Functions ---

pull_public_images() {
    echo "--- Pulling all public images to the host daemon ---"
    for IMAGE in "${PUBLIC_IMAGES[@]}"; do
        echo "Pulling ${IMAGE}"
        docker pull "${IMAGE}"
    done
}

build_images() {
    echo "--- Building custom service images with tag: ${FINAL_IMAGE_TAG} ---"
    for SERVICE in "${SERVICES[@]}"; do
        echo "Building ${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG}"
        docker build -t "${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG}" "./${SERVICE}"
    done
}

create_cluster() {
    echo "--- Creating Kind cluster: ${CLUSTER_NAME} ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

load_images() {
    echo "--- Loading all images into Kind cluster one by one (this will take time) ---"
    local all_images_to_load=("${PUBLIC_IMAGES[@]}")
    for SERVICE in "${SERVICES[@]}"; do
        all_images_to_load+=("${IMAGE_PREFIX}/${SERVICE}:${FINAL_IMAGE_TAG}")
    done
    
    for IMAGE in "${all_images_to_load[@]}"; do
        echo "Loading image: ${IMAGE}"
        kind load docker-image --name "${CLUSTER_NAME}" "${IMAGE}"
    done
}

# --- Command Line Argument Parsing for Jenkins ---

case "$1" in
    pull_public_images)
        pull_public_images
        ;;
    build_images)
        build_images
        ;;
    create_cluster)
        create_cluster
        ;;
    load_images)
        load_images
        ;;
    *)
        echo "Usage for Jenkins: $0 {pull_public_images|build_images|create_cluster|load_images}"
        echo "Running full sequence for manual execution..."
        pull_public_images
        build_images
        create_cluster
        load_images
        echo "--- Manual run complete. The cluster is up and loaded with images. ---"
        ;;
esac