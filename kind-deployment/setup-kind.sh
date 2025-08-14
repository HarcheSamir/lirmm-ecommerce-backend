#!/usr/bin/env bash
set -euo pipefail

# ----------------------
# Configuration
# ----------------------
CLUSTER_NAME="${CLUSTER_NAME:-lirmm-dev-cluster}"
KIND_CONFIG_FILE="${KIND_CONFIG_FILE:-./kind-deployment/kind-cluster-config.yaml}"
APP_NAMESPACE="${APP_NAMESPACE:-lirmm-services}"

# ----------------------
# Helpers
# ----------------------
log() { echo -e "\n--- $*"; }

create_cluster_and_install_istio() {
  log "Creating new Kind cluster: ${CLUSTER_NAME}"
  kind create cluster --name "${CLUSTER_NAME}" --config "${KIND_CONFIG_FILE}"

  log "Checking for istioctl in PATH"
  if ! command -v istioctl &> /dev/null; then
    echo "FATAL: istioctl not found. Please put istioctl in PATH (Jenkins must have it)."
    exit 1
  fi

  log "Installing Istio (demo profile)"
  istioctl install --set profile=demo -y

  log "Waiting for Istio control plane to be ready"
  kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

  log "Configuring istio-ingressgateway service as NodePort (port 80 -> nodePort 30000)"
  # Patch to add nodePort (idempotent)
  kubectl -n istio-system patch svc istio-ingressgateway --type='merge' -p '{"spec":{"type":"NodePort"}}' || true
  # Replace port 80 nodePort (try safe JSON patch)
  kubectl -n istio-system patch svc istio-ingressgateway --type='json' -p "[{\"op\":\"replace\",\"path\":\"/spec/ports/0/nodePort\",\"value\":30000}]" || true

  log "Istio installed and ingressgateway configured."
}

install_istio_addons() {
  log "Installing Istio addons (Kiali, Prometheus, Grafana) if available"
  ISTIO_DIR_PATH="$(dirname "$(dirname "$(which istioctl)")")" || true
  if [ -d "${ISTIO_DIR_PATH}/samples/addons" ]; then
    kubectl apply -f "${ISTIO_DIR_PATH}/samples/addons/kiali.yaml" || true
    kubectl apply -f "${ISTIO_DIR_PATH}/samples/addons/prometheus.yaml" || true
    kubectl apply -f "${ISTIO_DIR_PATH}/samples/addons/grafana.yaml" || true

    kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=6m || echo "Kiali may not be ready"
    kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=6m || echo "Prometheus may not be ready"
    kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=6m || echo "Grafana may not be ready"
  else
    echo "WARNING: Istio samples/addons not found at ${ISTIO_DIR_PATH}/samples/addons - skipping addons."
  fi
}

setup_namespace() {
  log "Ensuring namespace '${APP_NAMESPACE}' exists and has istio injection label"
  kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
  kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite || true
}

# ----------------------
# Main
# ----------------------
log "Checking for existing Kind cluster '${CLUSTER_NAME}'..."
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
  log "Cluster not found. Creating cluster and installing Istio (this will take a while)..."
  create_cluster_and_install_istio
  install_istio_addons
else
  log "Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation."
fi

setup_namespace

log "Setup script finished."
