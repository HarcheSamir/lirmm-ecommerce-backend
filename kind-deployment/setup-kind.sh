#!/bin/bash
# kind-deployment/setup-kind.sh
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"
REGISTRY_NAME='kind-registry'
REGISTRY_PORT='5001'
ISTIO_VERSION="1.26.3"

# --- Main Functions ---
setup_registry() {
  echo "--- Setting up local Docker registry ---"
  if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
    echo "Starting local Docker registry '${REGISTRY_NAME}' on host port ${REGISTRY_PORT}"
    docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" --name "${REGISTRY_NAME}" registry:2
  else
    echo "Local registry '${REGISTRY_NAME}' is already running."
  fi
}

create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

connect_registry_to_network() {
    echo "--- Connecting the local registry to the Kind Docker network ---"
    docker network connect "kind" "${REGISTRY_NAME}" || echo "Registry is already connected to the Kind network."
}

install_istio_core() {
    echo "--- Installing Istio CORE from LOCAL REGISTRY ---"
    istioctl install --set profile=demo -y \
      --set hub="localhost:5001/istio" \
      --set tag="${ISTIO_VERSION}"
    echo "--- Istio core installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio ADDONS from LOCAL REGISTRY ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")
    ADDONS_DIR="${ISTIO_DIR}/samples/addons"
    LOCAL_REGISTRY_URL="localhost:5001"

    if [ ! -d "$ADDONS_DIR" ]; then
        echo "--- FATAL: Could not find Istio samples/addons directory. ---"
        exit 1
    fi

    # Create a temporary directory for the modified addon manifests
    TMP_ADDONS_DIR=$(mktemp -d)
    cp -r ${ADDONS_DIR}/* ${TMP_ADDONS_DIR}/

    echo "--- Modifying addon manifests to use local registry: ${LOCAL_REGISTRY_URL} ---"
    # This is the critical step to make the addons use the local registry.
    sed -i "s|image: prom/prometheus.*|image: ${LOCAL_REGISTRY_URL}/prom/prometheus:v2.53.1|g" "${TMP_ADDONS_DIR}/prometheus.yaml"
    sed -i "s|image: jaegertracing/all-in-one.*|image: ${LOCAL_REGISTRY_URL}/jaegertracing/all-in-one:1.59|g" "${TMP_ADDONS_DIR}/jaeger.yaml"
    sed -i "s|image: docker.io/grafana/grafana.*|image: ${LOCAL_REGISTRY_URL}/grafana/grafana:11.3.1|g" "${TMP_ADDONS_DIR}/grafana.yaml"
    sed -i "s|image: quay.io/kiali/kiali.*|image: ${LOCAL_REGISTRY_URL}/quay.io/kiali/kiali:v1.92|g" "${TMP_ADDONS_DIR}/kiali.yaml"
    sed -i "s|image: grafana/loki.*|image: ${LOCAL_REGISTRY_URL}/grafana/loki:3.2.1|g" "${TMP_ADDONS_DIR}/loki.yaml"

    echo "--- Applying modified addon manifests ---"
    kubectl apply -f "${TMP_ADDONS_DIR}"

    # Clean up the temporary directory
    rm -rf "${TMP_ADDONS_DIR}"

    echo "--- Waiting for ALL Istio system deployments (core and addons) to be ready ---"
    kubectl wait --for=condition=Available deployment --all -n istio-system --timeout=15m
}

configure_gateway() {
    echo "--- Configuring Istio Ingress Gateway Service to use NodePort ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" || echo "Namespace '${APP_NAMESPACE}' already exists."
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---
echo "--- Starting Full Cluster Setup ---"
setup_registry
create_cluster
connect_registry_to_network
install_istio_core
install_istio_addons
configure_gateway
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"