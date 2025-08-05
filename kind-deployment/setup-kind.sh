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
    echo "--- Checking for istioctl ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "istioctl could not be found. Please install it first."
        echo "See: https://istio.io/latest/docs/setup/getting-started/"
        exit 1
    fi

    echo "--- Installing Istio onto the cluster (demo profile) ---"
    istioctl install --set profile=demo -y

    echo "--- Configuring Istio Ingress Gateway Service ---"
    # Patch the service to use a predictable NodePort that matches kind-cluster-config.yaml
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio installation complete. ---"
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" || echo "Namespace '${APP_NAMESPACE}' already exists."
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---
echo "--- Starting Full Cluster Setup with Istio ---"
create_cluster
install_istio
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "Your Istio-enabled Kind cluster is ready."
echo "Deploy your applications to the '${APP_NAMESPACE}' namespace."
echo "Access services via Istio Ingress at: http://localhost:13000"
echo "---"