#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

# --- Helper Functions for modularity ---

create_cluster_and_install_istio() {
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"

    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found in the PATH. Please ensure it's available to Jenkins."
        exit 1
    fi

    echo "--- THIS IS THE FIX: Installing Istio with the Ingress Gateway correctly configured from the start ---"
    # This single command sets the gateway type to NodePort and assigns the http2 port (the one on port 80) to nodePort 30000.
    # This is the robust way and removes the need for fragile patching later.
    istioctl install --set profile=demo -y \
        --set gateways.istio-ingressgateway.type=NodePort \
        --set gateways.istio-ingressgateway.ports[1].name=http2 \
        --set gateways.istio-ingressgateway.ports[1].port=80 \
        --set gateways.istio-ingressgateway.ports[1].targetPort=8080 \
        --set gateways.istio-ingressgateway.ports[1].nodePort=30000

    echo "--- Waiting for Istio control plane to be ready ---"
    kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

    echo "--- Istio core installation complete. The gateway is correctly configured. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana) ---"
    ISTIO_DIR_PATH=$(dirname "$(dirname "$(which istioctl)")")

    if [ -d "$ISTIO_DIR_PATH/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/prometheus.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/grafana.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/kiali.yaml"

        echo "--- Waiting for selected addons to be ready ---"
        kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=10m || echo "--- WARNING: Prometheus may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=10m || echo "--- WARNING: Grafana may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=10m || echo "--- WARNING: Kiali may not be fully ready ---"
    else
        echo "--- WARNING: Could not find Istio samples/addons directory at '$ISTIO_DIR_PATH/samples/addons'. Skipping addon installation. ---"
    fi
}

setup_namespace() {
    echo "--- Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Main Script Execution ---

echo "--- Checking for existing Kind cluster '${CLUSTER_NAME}' ---"
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "--- Cluster not found. Starting Full Cluster and Istio Setup... ---"
    create_cluster_and_install_istio
    install_istio_addons
else
    echo "--- Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation and Istio installation. ---"
fi

setup_namespace

echo "--- SETUP SCRIPT COMPLETE ---"