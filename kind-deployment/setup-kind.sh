#!/bin/bash
set -e


CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

create_cluster_and_install_istio() {
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"

    # --- START: ISTIO CORE RELIABILITY FIX ---
    echo "--- Pre-pulling and loading critical Istio images into Kind cluster ---"
    ISTIO_VERSION="1.26.3"
    docker pull docker.io/istio/pilot:${ISTIO_VERSION}
    docker pull docker.io/istio/proxyv2:${ISTIO_VERSION}
    kind load docker-image docker.io/istio/pilot:${ISTIO_VERSION} --name "${CLUSTER_NAME}"
    kind load docker-image docker.io/istio/proxyv2:${ISTIO_VERSION} --name "${CLUSTER_NAME}"
    # --- END: ISTIO CORE RELIABILITY FIX ---

    echo "--- Checking for istioctl in the PATH ---"
    if ! command -v istioctl &> /dev/null; then
        echo "FATAL: istioctl could not be found in the PATH. Please ensure it's available to Jenkins."
        exit 1
    fi

    echo "--- Installing Istio with a configuration overlay for the Ingress Gateway ---"
    # This uses a YAML overlay, which is the most robust way to configure the gateway.
    # It avoids the validation errors caused by multiple --set flags.
    istioctl install --set profile=demo -y -f - <<EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  components:
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        service:
          type: NodePort
          ports:
            # This section explicitly configures the HTTP port to use NodePort 30000
            - port: 80
              targetPort: 8080
              nodePort: 30000
              name: http2
EOF

    echo "--- Waiting for Istio control plane to be ready ---"
    kubectl wait --for=condition=Available deployment/istiod -n istio-system --timeout=10m

    echo "--- Istio core installation complete. ---"
}

install_istio_addons() {
    echo "--- Installing Istio addons (Kiali, Prometheus, Grafana) ---"
    ISTIO_DIR_PATH="/home/harch/istio-1.26.3"

    # --- START: VERIFIED ISTIO ADDONS RELIABILITY FIX ---
    # Pre-load addon images based on the exact versions in your local Istio installation files.
    echo "--- Pre-pulling and loading verified addon images into Kind cluster ---"
    
    # Images for Prometheus (from your prometheus.yaml)
    docker pull ghcr.io/prometheus-operator/prometheus-config-reloader:v0.81.0
    docker pull prom/prometheus:v3.2.1
    kind load docker-image ghcr.io/prometheus-operator/prometheus-config-reloader:v0.81.0 --name "${CLUSTER_NAME}"
    kind load docker-image prom/prometheus:v3.2.1 --name "${CLUSTER_NAME}"
    
    # Image for Grafana (from your grafana.yaml)
    docker pull docker.io/grafana/grafana:11.3.1
    kind load docker-image docker.io/grafana/grafana:11.3.1 --name "${CLUSTER_NAME}"
    
    # Image for Kiali (from your kiali.yaml)
    docker pull quay.io/kiali/kiali:v2.8
    kind load docker-image quay.io/kiali/kiali:v2.8 --name "${CLUSTER_NAME}"
    # --- END: VERIFIED ISTIO ADDONS RELIABILITY FIX ---

    if [ -d "$ISTIO_DIR_PATH/samples/addons" ]; then
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/kiali.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/prometheus.yaml"
        kubectl apply -f "$ISTIO_DIR_PATH/samples/addons/grafana.yaml"

        echo "--- Waiting for selected addons to be ready ---"
        kubectl wait --for=condition=Available deployment/kiali -n istio-system --timeout=10m || echo "--- WARNING: Kiali may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/prometheus -n istio-system --timeout=10m || echo "--- WARNING: Prometheus may not be fully ready ---"
        kubectl wait --for=condition=Available deployment/grafana -n istio-system --timeout=10m || echo "--- WARNING: Grafana may not be fully ready ---"
    else
        echo "--- WARNING: Could not find Istio samples/addons directory at '$ISTIO_DIR_PATH/samples/addons'. Skipping addon installation. ---"
    fi
}

setup_namespace() {
    echo "--- Ensuring namespace '${APP_NAMESPACE}' exists and is labeled for Istio injection ---"
    kubectl create namespace "${APP_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace "${APP_NAMESPACE}" istio-injection=enabled --overwrite
}

echo "--- Checking for existing Kind cluster '${CLUSTER_NAME}' ---"
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "--- Cluster not found. Starting Full Cluster and Istio Setup... ---"
    create_cluster_and_install_istio
    install_istio_addons
else
    echo "--- Cluster '${CLUSTER_NAME}' already exists. Skipping cluster creation and Istio installation. ---"
fi

setup_namespace

echo "--- SETUP SCRIPT COMPLETE ---"