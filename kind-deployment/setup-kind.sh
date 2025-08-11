#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

# --- Main Functions ---

create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "FATAL: istioctl could not be found in the PATH."
        exit 1
    fi

    # --- THE KEY FIX: Use the 'default' profile for a much leaner control plane ---
    echo "--- Installing Istio with the efficient 'default' profile ---"
    istioctl install --set profile=default -y

    echo "--- Configuring Istio Ingress Gateway Service ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'
    echo "--- Core Istio installation complete. ---"
}

install_and_wait_for_addons() {
    echo "--- Installing required Istio addons (Prometheus, Grafana, Kiali) ---"
    # Find Istio installation directory.
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")

    if [ ! -d "$ISTIO_DIR/samples/addons" ]; then
        echo "--- FATAL: Could not find Istio samples/addons directory. Cannot install addons. ---"
        exit 1
    fi

    # --- Step 1: Apply ONLY the addon manifests you need ---
    echo "--- Applying Prometheus... ---"
    kubectl apply -f "$ISTIO_DIR/samples/addons/prometheus.yaml"

    echo "--- Applying Grafana... ---"
    kubectl apply -f "$ISTIO_DIR/samples/addons/grafana.yaml"

    echo "--- Applying Kiali... ---"
    kubectl apply -f "$ISTIO_DIR/samples/addons/kiali.yaml"
    
    # --- Step 2: Wait specifically and efficiently for ONLY those 3 deployments ---
    echo "--- Waiting for Prometheus to be ready... ---"
    kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=5m
    
    echo "--- Waiting for Grafana to be ready... ---"
    kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=5m

    echo "--- Waiting for Kiali to be ready... ---"
    kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=5m
    
    echo "--- All required addons are ready. ---"
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---

echo "--- Starting Optimized Infrastructure Setup ---"
create_cluster
install_istio
# This function is now named more accurately and is much more efficient
install_and_wait_for_addons
setup_namespace
echo "---"
echo "--- SETUP SCRIPT COMPLETE ---"
echo "---"