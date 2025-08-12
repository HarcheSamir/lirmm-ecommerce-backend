#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

# --- Main Functions ---
create_cluster() {
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "FATAL: istioctl could not be found in the PATH provided by Jenkins."
        exit 1
    fi

    echo "--- Installing Istio onto the cluster (demo profile with GCR mirror) ---"
    istioctl install --set profile=demo --set hub=gcr.io/istio-release -y

    echo "--- Waiting for Istio control plane to be ready ---"
    kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

    echo "--- Configuring Istio Ingress Gateway Service ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana only) ---"
    ISTIO_DIR="$(dirname "$(dirname "$(which istioctl)")")"

    if [ -d "$ISTIO_DIR/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR/samples/addons/kiali.yaml"
        kubectl apply -f "$ISTIO_DIR/samples/addons/prometheus.yaml"
        kubectl apply -f "$ISTIO_DIR/samples/addons/grafana.yaml"

        echo "--- Waiting for selected addons to be ready ---"
        kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=10m || echo "--- WARNING: Kiali may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=10m || echo "--- WARNING: Prometheus may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=10m || echo "--- WARNING: Grafana may not be fully ready ---"
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
# =================================================================
# THIS IS THE ONLY CHANGE THAT MATTERS
# Instead of deleting, we check if the cluster exists.
# =================================================================
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "--- Cluster not found. Starting Full Cluster and Istio Setup ---"
    create_cluster
    install_istio
    install_istio_addons
else
    echo "--- Cluster '${CLUSTER_NAME}' already exists. Skipping creation. ---"
fi

# We always run this to make sure the namespace is configured.
setup_namespace

echo "---"
echo "--- SETUP SCRIPT COMPLETE ---"
echo "---"