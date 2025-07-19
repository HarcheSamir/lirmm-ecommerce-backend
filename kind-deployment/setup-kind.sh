#!/bin/bash

# THIS IS A TEMPORARY SCRIPT FOR A FAST TEST RUN.
# IT DOES NOT BUILD OR LOAD IMAGES.

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# --- Configuration ---
: "${CLUSTER_NAME:="lirmm-dev-cluster"}"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
KUBECONFIG_INTERNAL_PATH="${PWD}/kubeconfig.internal"

# --- Functions ---

cleanup_and_create_cluster() {
  echo "--- 1. CREATING A FRESH, EMPTY KIND CLUSTER (ETA: ~2 minutes) ---"
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    kind delete cluster --name "$CLUSTER_NAME"
  fi
  kind create cluster --name "$CLUSTER_NAME" --config="${KIND_CONFIG_FILE}"

  echo "--- 2. GENERATING AND CORRECTING KUBECONFIG ---"
  kind get kubeconfig --name "$CLUSTER_NAME" --internal > "${KUBECONFIG_INTERNAL_PATH}"
  KIND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${CLUSTER_NAME}-control-plane")
  sed -i "s|server: https://.*:6443|server: https://${KIND_IP}:6443|g" "${KUBECONFIG_INTERNAL_PATH}"
}

test_kubernetes_connection() {
  echo "--- 3. TESTING KUBERNETES API CONNECTION (ETA: ~10 seconds) ---"
  export KUBECONFIG="${KUBECONFIG_INTERNAL_PATH}"
  # This simple command is the only test needed. It proves connectivity.
  kubectl cluster-info
  unset KUBECONFIG
  rm -f "${KUBECONFIG_INTERNAL_PATH}"
}

# --- Main Execution ---

cleanup_and_create_cluster

### --- SKIPPING SLOW STEPS FOR THIS TEST --- ###
echo "--- SKIPPING: build_custom_images ---"
echo "--- SKIPPING: load_images_to_kind ---"
### ----------------------------------------- ###

test_kubernetes_connection

echo ""
echo "#########################################################"
echo "###                  TEST SUCCEEDED                   ###"
echo "### Connection to the cluster is working.             ###"
echo "### The final bug is fixed. Restore the full script.  ###"
echo "#########################################################"