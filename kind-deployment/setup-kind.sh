#!/bin/bash
# kind-deployment/setup-kind.sh
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"
REGISTRY_SETUP_SCRIPT="./kind-deployment/setup-registry.sh"
REGISTRY_NAME="kind-registry"

# --- Main Functions ---
setup_registry() {
    echo "--- Setting up local registry ---"
    chmod +x "${REGISTRY_SETUP_SCRIPT}"
    "${REGISTRY_SETUP_SCRIPT}"
}

create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

connect_registry_to_cluster() {
    echo "--- Connecting the local registry to the Kind network ---"
    # The registry and the kind nodes need to be in the same docker network
    # to communicate.
    docker network connect "kind" "${REGISTRY_NAME}" || echo "Registry already connected to Kind network."
}

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "FATAL: istioctl could not be found in the PATH provided by Jenkins."
        exit 1
    fi

    echo "--- Installing Istio onto the cluster (demo profile) ---"
    istioctl install --set profile=demo -y

    echo "--- Configuring Istio Ingress Gateway Service ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana, etc.) ---"
    # Find the istio installation directory to locate the addons
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
setup_registry
create_cluster
connect_registry_to_cluster
install_istio
install_istio_addons
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"