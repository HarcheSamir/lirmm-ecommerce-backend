#!/usr/bin/env bash
# CORRECTED SCRIPT - respects existing istioctl & installs specific addons
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

  # CHECK FOR ISTIOCTL BEFORE DOING ANYTHING
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

  # --- START OF MODIFIED BLOCK ---
  log "Installing Istio addons (Kiali, Prometheus, Grafana)..."
  # Find the installation directory of istioctl to locate the samples
  ISTIOCTL_PATH=$(command -v istioctl)
  ISTIO_BASE_DIR=$(dirname $(dirname ${ISTIOCTL_PATH}))
  ADDONS_DIR="${ISTIO_BASE_DIR}/samples/addons"

  if [ -d "${ADDONS_DIR}" ]; then
      log "Applying Prometheus manifest..."
      kubectl apply -f "${ADDONS_DIR}/prometheus.yaml"

      log "Applying Grafana manifest..."
      kubectl apply -f "${ADDONS_DIR}/grafana.yaml"

      log "Applying Kiali manifest..."
      kubectl apply -f "${ADDONS_DIR}/kiali.yaml"

      log "Waiting for addons to be ready..."
      # We explicitly wait only for the deployments we care about
      kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=5m || echo "WARNING: Prometheus did not become ready in time."
      kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=5m || echo "WARNING: Grafana did not become ready in time."
      kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=5m || echo "WARNING: Kiali did not become ready in time."
  else
      echo "WARNING: Could not find Istio addons in ${ADDONS_DIR}. Skipping addon installation."
  fi
  # --- END OF MODIFIED BLOCK ---

else
  log "Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation and Istio install."
fi

log "Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection"
kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite=true

log "Setup script finished successfully."