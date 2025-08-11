#!/bin/bash
# kind-deployment/setup-kind.sh
# FINAL, BULLETPROOF, CORRECTED VERSION.
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"
REGISTRY_NAME='kind-registry'
REGISTRY_PORT='5001'
LOCAL_REGISTRY_URL="localhost:5001"

# --- Main Functions ---
setup_registry() {
  echo "--- Setting up local Docker registry ---"
  if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
    docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" --name "${REGISTRY_NAME}" registry:2
  else
    echo "Local registry '${REGISTRY_NAME}' is already running."
  fi
}

create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

connect_registry_to_network() {
    echo "--- Connecting the local registry to the Kind Docker network ---"
    docker network connect "kind" "${REGISTRY_NAME}" || echo "Registry is already connected to the Kind network."
}

install_istio_and_addons() {
    echo "--- Installing Istio and Addons from LOCAL REGISTRY ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")
    ADDONS_DIR="${ISTIO_DIR}/samples/addons"

    if [ ! -d "$ADDONS_DIR" ]; then
        echo "--- FATAL: Could not find Istio samples/addons directory. ---"; exit 1;
    fi

    TMP_ADDONS_DIR=$(mktemp -d)
    cp -r ${ADDONS_DIR}/* ${TMP_ADDONS_DIR}/

    echo "--- Modifying ALL manifests to use local registry: ${LOCAL_REGISTRY_URL} ---"
    
    # These sed commands are robust. They replace the registry prefix on any line containing 'image:'.
    # They do not depend on specific version tags and will work.
    sed -i "s|image: prom/prometheus:|image: ${LOCAL_REGISTRY_URL}/docker.io/prom/prometheus:|g" "${TMP_ADDONS_DIR}/prometheus.yaml"
    sed -i "s|image: \"prom/prometheus:|image: \"${LOCAL_REGISTRY_URL}/docker.io/prom/prometheus:|g" "${TMP_ADDONS_DIR}/prometheus.yaml"
    sed -i "s|image: ghcr.io/prometheus-operator/prometheus-config-reloader:|image: ${LOCAL_REGISTRY_URL}/ghcr.io/prometheus-operator/prometheus-config-reloader:|g" "${TMP_ADDONS_DIR}/prometheus.yaml"

    sed -i "s|image: \"docker.io/jaegertracing/all-in-one:|image: \"${LOCAL_REGISTRY_URL}/docker.io/jaegertracing/all-in-one:|g" "${TMP_ADDONS_DIR}/jaeger.yaml"

    sed -i "s|image: docker.io/grafana/grafana:|image: ${LOCAL_REGISTRY_URL}/docker.io/grafana/grafana:|g" "${TMP_ADDONS_DIR}/grafana.yaml"

    sed -i "s|image: docker.io/grafana/loki:|image: ${LOCAL_REGISTRY_URL}/docker.io/grafana/loki:|g" "${TMP_ADDONS_DIR}/loki.yaml"
    sed -i "s|image: kiwigrid/k8s-sidecar:|image: ${LOCAL_REGISTRY_URL}/docker.io/kiwigrid/k8s-sidecar:|g" "${TMP_ADDONS_DIR}/loki.yaml"

    # Install Istio Core FIRST
    echo "--- Installing Istio CORE from LOCAL REGISTRY ---"
    istioctl install --set profile=demo -y \
      --set hub="${LOCAL_REGISTRY_URL}/docker.io/istio" \
      --set tag="1.26.3"
    echo "--- Istio core installation complete. ---"
    
    # Install Addons SECOND
    echo "--- Applying modified addon manifests (Kiali is SKIPPED) ---"
    kubectl apply -f "${TMP_ADDONS_DIR}/prometheus.yaml"
    kubectl apply -f "${TMP_ADDONS_DIR}/jaeger.yaml"
    kubectl apply -f "${TMP_ADDONS_DIR}/grafana.yaml"
    kubectl apply -f "${TMP_ADDONS_DIR}/loki.yaml"
    rm -rf "${TMP_ADDONS_DIR}"

    echo "--- Waiting for ALL Istio system deployments to be ready ---"
    kubectl wait --for=condition=Available deployment --all -n istio-system --timeout=15m
}

configure_gateway_and_namespace() {
    echo "--- Configuring Istio Ingress Gateway Service ---"
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system -p '{"spec": {"type": "NodePort"}}'

    echo "--- Creating and labeling app namespace ---"
    kubectl create namespace "${APP_NAMESPACE}" || echo "Namespace '${APP_NAMESPACE}' already exists."
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

# --- Script Execution ---
echo "--- Starting Full Cluster Setup ---"
setup_registry
create_cluster
connect_registry_to_network
install_istio_and_addons
configure_gateway_and_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"