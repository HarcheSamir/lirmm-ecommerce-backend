#!/usr/bin/env bash
set -euo pipefail

# Configuration
CLUSTER_NAME="${KIND_CLUSTER_NAME:-lirmm-dev-cluster}"
KIND_CONFIG_FILE="${KIND_CONFIG_FILE:-./kind-deployment/kind-cluster-config.yaml}"
APP_NAMESPACE="${APP_NAMESPACE:-lirmm-services}"
ISTIO_VERSION="1.21.2" # Specify a stable Istio version

# Helpers
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
  log "Cluster not found. Creating new cluster and installing Istio (this will take a while)..."

  log "Creating Kind cluster: ${CLUSTER_NAME}"
  kind create cluster --name "${CLUSTER_NAME}" --config "${KIND_CONFIG_FILE}"

  log "Installing istioctl if not present..."
  if ! command -v istioctl &> /dev/null; then
      echo "istioctl not found, downloading version ${ISTIO_VERSION}..."
      curl -L https://istio.io/downloadIstio | ISTIO_VERSION=${ISTIO_VERSION} sh -
      # Assuming this script runs from the repo root, istio will be downloaded here.
      # In Jenkins, you should add its bin to the PATH.
      export PATH="$PWD/istio-${ISTIO_VERSION}/bin:$PATH"
  fi

  log "Installing Istio (demo profile)"
  istioctl install --set profile=demo -y

  log "Waiting for Istio control plane to be ready..."
  kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

  log "Configuring istio-ingressgateway service as NodePort..."
  # Patch to ensure the type is NodePort, then patch the specific port. This is idempotent.
  kubectl -n istio-system patch svc istio-ingressgateway --type='json' -p='[{"op": "replace", "path": "/spec/type", "value": "NodePort"}]'
  kubectl -n istio-system patch svc istio-ingressgateway --type='json' -p='[{"op": "replace", "path": "/spec/ports/0/nodePort", "value": 30000}]'

  log "Installing Istio addons (Kiali, Prometheus, Grafana)..."
  # Fetch the addons YAML and apply them
  ISTIO_DIR=$(istioctl manifest generate --set profile=demo | grep -o 'istio-.*' | head -1 | cut -d/ -f1)
  git clone --depth 1 https://github.com/istio/istio.git /tmp/istio-repo
  kubectl apply -f /tmp/istio-repo/samples/addons
  rm -rf /tmp/istio-repo

  log "Waiting for addons to be ready..."
  kubectl wait --for=condition=Available deployment --all -n istio-system --timeout=6m || echo "WARNING: Some Istio addons may not be ready yet."

else
  log "Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation and Istio install."
fi

log "Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection"
kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite=true

log "Setup script finished successfully."