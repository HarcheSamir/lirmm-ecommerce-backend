#!/bin/bash
set -e

# THIS IS A TEMPORARY SCRIPT FOR A FAST TEST.
# IT ONLY CREATES AN EMPTY CLUSTER.

# --- Configuration ---
CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"

# --- Main Logic ---
echo "--- Starting fast test: Creating a fresh, empty Kind cluster ---"
kind delete cluster --name "${CLUSTER_NAME}" || true
kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"
echo "--- Cluster created successfully. Handing back to Jenkins for the connection test. ---"