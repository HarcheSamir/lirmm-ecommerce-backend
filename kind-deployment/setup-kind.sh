#!/bin/bash
set -e


CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
APP_NAMESPACE="lirmm-services"

create_cluster_and_install_istio() {
    echo "--- Creating new Kind cluster: ${CLUSTER_NAME} ---"
    kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"

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
    ISTIO_DIR_PATH=$(dirname "$(dirname "$(which istioctl)")")

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