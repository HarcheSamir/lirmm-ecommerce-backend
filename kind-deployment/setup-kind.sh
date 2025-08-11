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

wait_for_cluster_ready() {
    echo "--- Waiting for cluster nodes to be ready ---"
    
    # Wait for nodes to be Ready (max 5 minutes)
    kubectl wait --for=condition=Ready nodes --all --timeout=300s
    
    echo "--- Removing any lingering taints from control-plane node ---"
    # Remove common taints that prevent scheduling
    kubectl taint nodes --all node.kubernetes.io/not-ready- || true
    kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true
    
    # Double-check node status
    echo "--- Final node status check ---"
    kubectl get nodes
    
    # Wait a bit more for any pending operations
    echo "--- Waiting 30 seconds for cluster to fully stabilize ---"
    sleep 30
}

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "FATAL: istioctl could not be found in the PATH provided by Jenkins."
        exit 1
    fi

    echo "--- Installing Istio onto the cluster (minimal profile + addons) ---"
    
    # Install minimal Istio first (much faster)
    istioctl install --set profile=minimal -y &
    ISTIO_PID=$!
    
    # Monitor progress while installation runs
    echo "--- Monitoring Istio installation progress ---"
    while kill -0 $ISTIO_PID 2>/dev/null; do
        echo ">>> Istio still installing... checking pod status:"
        kubectl get pods -n istio-system 2>/dev/null || echo "istio-system namespace not created yet"
        sleep 15
    done
    
    # Wait for the background process and check if it succeeded
    wait $ISTIO_PID
    if [ $? -ne 0 ]; then
        echo "--- Istio installation failed, retrying once ---"
        istioctl install --set profile=demo -y
    fi
    
    echo "--- Waiting for Istiod to be fully ready ---"
    kubectl wait --for=condition=available deployment/istiod -n istio-system --timeout=300s

    echo "--- Configuring Istio Ingress Gateway Service ---"
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
        kubectl wait --for=condition=Available deployment -n istio-system --all --timeout=10m || echo "--- WARNING: Some addons may not be fully ready ---"
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
echo "--- Starting Full Cluster Setup with Istio ---"
create_cluster
wait_for_cluster_ready  # NEW: Wait for cluster to be fully ready
install_istio
install_istio_addons
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"