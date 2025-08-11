#!/bin/bash
set -e

# This script now assumes the Kind cluster already exists.
# It only handles the installation of Istio and its addons.

# --- Configuration ---
APP_NAMESPACE="lirmm-services"

# --- Main Functions ---

install_istio() {
    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null
    then
        echo "FATAL: istioctl could not be found in the PATH."
        exit 1
    fi

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
        echo "--- FATAL: Could not find Istio samples/addons directory. ---"
        exit 1
    fi

    echo "--- Applying addon manifests (Kiali requires Jaeger) ---"
    kubectl apply -f "$ISTIO_DIR/samples/addons/prometheus.yaml"
    kubectl apply -f "$ISTIO_DIR/samples/addons/grafana.yaml"
    kubectl apply -f "$ISTIO_DIR/samples/addons/jaeger.yaml" # Kiali depends on Jaeger
    kubectl apply -f "$ISTIO_DIR/samples/addons/kiali.yaml"
    
    echo "--- Waiting for Addons... (This will be fast now) ---"
    kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=5m
    kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=5m
    kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=5m
    
    echo "--- All required addons are ready. ---"
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    # Using --dry-run is a safe way to create if it doesn't exist
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---

echo "--- Starting Component Installation ---"
install_istio
install_and_wait_for_addons
setup_namespace
echo "---"
echo "--- INSTALLATION SCRIPT COMPLETE ---"
echo "---"