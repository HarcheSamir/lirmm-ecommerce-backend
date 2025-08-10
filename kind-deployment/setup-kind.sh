#!/bin/bash
set -e

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

# --- Versions ---
# Match these to your Istio release / addons manifests
ISTIO_VERSION=$(istioctl version --remote=false --short | head -n 1 | cut -d- -f1)
KIALI_VERSION="v1.78"
PROMETHEUS_VERSION="v2.46.0"
GRAFANA_VERSION="10.2.3"
JAEGER_VERSION="1.49"

# --- Main Functions ---
create_cluster() {
    echo "--- Deleting existing Kind cluster (if any) ---"
    kind delete cluster --name "${CLUSTER_NAME}" || true
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
}

preload_istio_images() {
    echo "--- Pulling Istio core images to host ---"
    docker pull "istio/pilot:${ISTIO_VERSION}"
    docker pull "istio/proxyv2:${ISTIO_VERSION}"

    echo "--- Loading Istio core images into Kind ---"
    kind load docker-image "istio/pilot:${ISTIO_VERSION}" --name "${CLUSTER_NAME}"
    kind load docker-image "istio/proxyv2:${ISTIO_VERSION}" --name "${CLUSTER_NAME}"
}

preload_addon_images() {
    echo "--- Pulling Istio addon images to host ---"
    docker pull "docker.io/kiali/kiali:${KIALI_VERSION}"
    docker pull "docker.io/prom/prometheus:${PROMETHEUS_VERSION}"
    docker pull "grafana/grafana:${GRAFANA_VERSION}"
    docker pull "jaegertracing/all-in-one:${JAEGER_VERSION}"

    echo "--- Loading Istio addon images into Kind ---"
    kind load docker-image "docker.io/kiali/kiali:${KIALI_VERSION}" --name "${CLUSTER_NAME}"
    kind load docker-image "docker.io/prom/prometheus:${PROMETHEUS_VERSION}" --name "${CLUSTER_NAME}"
    kind load docker-image "grafana/grafana:${GRAFANA_VERSION}" --name "${CLUSTER_NAME}"
    kind load docker-image "jaegertracing/all-in-one:${JAEGER_VERSION}" --name "${CLUSTER_NAME}"
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
    kubectl patch svc istio-ingressgateway -n istio-system --type='json' \
        -p='[{"op": "replace", "path": "/spec/ports/1/nodePort", "value":30000}]'
    kubectl patch svc istio-ingressgateway -n istio-system \
        -p '{"spec": {"type": "NodePort"}}'

    echo "--- Istio installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana, Jaeger) ---"
    ISTIO_DIR=$(dirname "$(dirname "$(which istioctl)")")

    if [ -d "$ISTIO_DIR/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR/samples/addons"
        echo "--- Waiting for addons to be ready ---"
        kubectl wait --for=condition=Available deployment -n istio-system --all --timeout=10m \
            || echo "--- WARNING: Some addons may not be fully ready ---"
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
preload_istio_images
preload_addon_images
install_istio
install_istio_addons
setup_namespace
echo "---"
echo "--- SETUP COMPLETE ---"
echo "---"
