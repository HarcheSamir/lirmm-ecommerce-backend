#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"
# THIS IS THE FIX: The cluster will resolve this name via the 'kind' docker network
REGISTRY_URL_FOR_CLUSTER="local-registry:5000"

# --- Main Functions ---

create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    echo "--- It will be configured to connect to the registry at '${REGISTRY_URL_FOR_CLUSTER}' ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found in the PATH provided by Jenkins."
        exit 1
    fi

    # THIS IS THE FIX: Use the container name for the hub URL.
    echo "--- Installing Istio (demo profile) using registry hub '${REGISTRY_URL_FOR_CLUSTER}/istio' ---"
    istioctl install --set profile=demo -y --set hub="${REGISTRY_URL_FOR_CLUSTER}/istio"

    echo "--- Configuring Istio Ingress Gateway Service ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")

    if [ -d "$ISTIO_DIR/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR/samples/addons"
        echo "--- Waiting for addons to be ready ---"
        kubectl wait --for=condition=Available deployment -n istio-system --all --timeout=10m || echo "--- WARNING: Some addons may not be fully ready ---"
    else
        echo "--- WARNING: Could not find Istio samples/addons directory. Skipping addon installation. ---"
    fi
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---

echo "--- Starting Full Cluster Setup with Istio ---"
create_cluster
install_istio
install_istio_addons
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"