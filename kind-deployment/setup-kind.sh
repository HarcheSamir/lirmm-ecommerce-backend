#!/bin/bash
set -e

# This script is designed to be robust on Kind by splitting the installation.

# --- Configuration ---
APP_NAMESPACE="lirmm-services"

# --- Main Functions ---

install_istio_core() {
    echo "--- (1/2) Installing Istio Core Components ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found."
        exit 1
    fi

    # Install Istio but DO NOT wait for it to be fully ready.
    # We will wait manually and more robustly in the next step.
    echo "--- Applying Istio core manifests... ---"
    istioctl install --set profile=default -y --skip-confirmation

    echo "--- Patching Ingress Gateway Service for NodePort access ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    # --- THE KEY FIX: Manually wait for the Ingress Gateway ---
    # This gives the Kind CNI time to assign an IP and avoids the race condition.
    echo "--- Waiting for Istio Ingress Gateway to be ready... ---"
    kubectl wait --for=condition=Available deployment/istio-ingressgateway -n istio-system --timeout=5m
    echo "--- Istio Core is now ready. ---"
}

install_addons() {
    echo "--- (2/2) Installing Required Istio Addons ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")

    if [ ! -d "$ISTIO_DIR/samples/addons" ]; then
        echo "--- FATAL: Could not find Istio samples/addons directory. ---"
        exit 1
    fi

    echo "--- Applying addon manifests... ---"
    kubectl apply -f "$ISTIO_DIR/samples/addons/prometheus.yaml"
    kubectl apply -f "$ISTIO_DIR/samples/addons/grafana.yaml"
    kubectl apply -f "$ISTIO_DIR/samples/addons/jaeger.yaml" # Kiali dependency
    kubectl apply -f "$ISTIO_DIR/samples/addons/kiali.yaml"
    # We apply Loki but don't strictly need to wait for it.
    kubectl apply -f "$ISTIO_DIR/samples/addons/loki.yaml"
    
    echo "--- Waiting for essential addons to be ready... ---"
    kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=5m
    kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=5m
    kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=5m
    
    echo "--- All required addons are ready. ---"
}

setup_namespace() {
    echo "--- Creating and labeling namespace '${APP_NAMESPACE}' for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---
echo "--- Starting Robust Component Installation ---"
install_istio_core
install_addons
setup_namespace
echo "---"
echo "--- INSTALLATION SCRIPT COMPLETE ---"
echo "---"