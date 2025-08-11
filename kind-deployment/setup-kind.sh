#!/bin/bash
# kind-deployment/setup-kind.sh
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"
REGISTRY_NAME='kind-registry'
REGISTRY_PORT='5001'
# !!! IMPORTANT: This version is now correct based on your output !!!
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

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found in the PATH."
        exit 1
    fi

    echo "--- Installing Istio from LOCAL REGISTRY to prevent network errors ---"
    # This now tells istioctl to use our local registry instead of the public one.
    istioctl install --set profile=demo -y \
      --set hub="localhost:5001/istio" \
      --set tag="${ISTIO_VERSION}"

    echo "--- Configuring Istio Ingress Gateway Service to use NodePort ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'
    echo "--- Istio installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana, etc.) ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")

    if [ -d "$ISTIO_DIR/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR/samples/addons"
        echo "--- Waiting for addons to be ready ---"
        kubectl wait --for=condition=Available deployment -n istio-system --all --timeout=12m || echo "--- WARNING: Some addons may not be fully ready, which can be okay. ---"
    else
        echo "--- WARNING: Could not find Istio samples/addons directory. Skipping addon installation. ---"
    fi
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
install_istio
install_istio_addons
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"