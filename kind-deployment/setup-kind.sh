#!/usr/bin/env bash
# CORRECTED SCRIPT - respects existing istioctl
set -euo pipefail

# Configuration
CLUSTER_NAME="${KIND_CLUSTER_NAME:-lirmm-dev-cluster}"
KIND_CONFIG_FILE="${KIND_CONFIG_FILE:-./kind-deployment/kind-cluster-config.yaml}"
APP_NAMESPACE="${APP_NAMESPACE:-lirmm-services}"

log() {
  echo
  echo "------------------------------------------------------------"
  echo "--> $1"
  echo "------------------------------------------------------------"
}

# Ensure tools are available
command -v kind >/dev/null 2>&1 || { echo "FATAL: kind not found in PATH."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "FATAL: kubectl not found in PATH."; exit 1; }

# Main Logic
log "Checking for existing Kind cluster '${CLUSTER_NAME}'"
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
  log "Cluster not found. Creating new cluster and installing Istio..."
  log "Creating Kind cluster: ${CLUSTER_NAME}"
  kind create cluster --name "${CLUSTER_NAME}" --config "${KIND_CONFIG_FILE}"

  # **FIX:** CHECK FOR ISTIOCTL BEFORE DOING ANYTHING
  if ! command -v istioctl &> /dev/null; then
      echo "FATAL: istioctl not found in PATH. Please ensure ISTIO_BIN_DIR is set correctly in Jenkins."
      exit 1
  else
      echo "Found istioctl version: $(istioctl version)"
  fi

  log "Installing Istio (demo profile)"
  istioctl install --set profile=demo -y

  log "Waiting for Istio control plane to be ready..."
  kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

  log "Configuring istio-ingressgateway service as NodePort..."
  kubectl -n istio-system patch svc istio-ingressgateway --type='json' -p='[{"op": "replace", "path": "/spec/type", "value": "NodePort"}]'
  kubectl -n istio-system patch svc istio-ingressgateway --type='json' -p='[{"op": "replace", "path": "/spec/ports/0/nodePort", "value": 30000}]'

  log "Installing Istio addons (Kiali, Prometheus, Grafana)..."
  # **FIX:** This uses the istioctl in your path to find the addons
  # We find the installation directory of istioctl to locate the samples
  ISTIOCTL_PATH=$(command -v istioctl)
  ISTIO_BASE_DIR=$(dirname $(dirname ${ISTIOCTL_PATH}))
  if [ -d "${ISTIO_BASE_DIR}/samples/addons" ]; then
      kubectl apply -f "${ISTIO_BASE_DIR}/samples/addons"
      log "Waiting for addons to be ready..."
      kubectl wait --for=condition=Available deployment --all -n istio-system --timeout=6m || echo "WARNING: Some Istio addons may not be ready yet."
  else
      echo "WARNING: Could not find Istio addons in ${ISTIO_BASE_DIR}/samples/addons. Skipping."
  fi

else
  log "Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation and Istio install."
fi

log "Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection"
kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite=true

log "Setup script finished successfully."