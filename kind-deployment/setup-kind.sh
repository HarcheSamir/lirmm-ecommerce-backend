#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

# --- Helper Functions for modularity ---
# This function creates the cluster and installs Istio from scratch.
create_cluster_and_install_istio() {
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
    
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found in the PATH. Please ensure it's available to Jenkins."
        exit 1
    fi

    echo "--- Installing Istio onto the cluster (demo profile) ---"
    # Use Google Container Registry mirror to avoid Docker Hub rate limits
    istioctl install --set profile=demo --set hub=gcr.io/istio-release -y

    echo "--- Waiting for Istio control plane to be ready ---"
    kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

    echo "--- Configuring Istio Ingress Gateway Service for NodePort access ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio core installation complete. ---"
}

# This function installs optional Istio monitoring addons.
install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana) ---"
    # Find the istioctl installation directory to locate the addons
    ISTIO_DIR_PATH="$(dirname "$(dirname "$(which istioctl)")")"
    
    if [ -d "$ISTIO_DIR_PATH/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/kiali.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/prometheus.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/grafana.yaml"

        echo "--- Waiting for selected addons to be ready ---"
        kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=10m || echo "--- WARNING: Kiali may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=10m || echo "--- WARNING: Prometheus may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=10m || echo "--- WARNING: Grafana may not be fully ready ---"
    else
        echo "--- WARNING: Could not find Istio samples/addons directory at '$ISTIO_DIR_PATH/samples/addons'. Skipping addon installation. ---"
    fi
}

# This function ensures the application namespace is created and labeled.
# It runs every time to guarantee the namespace is configured correctly.
setup_namespace() {
    echo "--- Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# This function clears all volumes by deleting and recreating infrastructure pods
clear_all_volumes() {
    echo "--- CLEARING ALL VOLUMES: Deleting infrastructure deployments to reset data ---"
    
    # Delete infrastructure deployments to clear volumes (emptyDir volumes will be recreated empty)
    kubectl delete deployment -n "${APP_NAMESPACE}" -l 'component in (zookeeper,kafka,elasticsearch,redis,database)' --ignore-not-found=true
    
    # Wait for pods to be fully terminated
    echo "--- Waiting for infrastructure pods to terminate completely ---"
    kubectl wait --for=delete pod -n "${APP_NAMESPACE}" -l 'component in (zookeeper,kafka,elasticsearch,redis,database)' --timeout=5m || echo "--- Some pods may have already been deleted ---"
    
    echo "--- Volume clearing complete. Infrastructure will be redeployed fresh. ---"
}

# --- Main Script Execution ---

echo "--- Checking for existing Kind cluster '${CLUSTER_NAME}' ---"

# =================================================================
# KEY CHANGE: Check if the cluster exists before creating it.
# =================================================================
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "--- Cluster not found. Starting Full Cluster and Istio Setup... This will take a while. ---"
    create_cluster_and_install_istio
    install_istio_addons
else
    echo "--- Cluster '${CLUSTER_NAME}' already exists. Clearing all volumes for fresh start. ---"
    clear_all_volumes
fi

# This function always runs to make sure the namespace is set up correctly.
setup_namespace

echo "---"
echo "--- SETUP SCRIPT COMPLETE ---"
echo "---"