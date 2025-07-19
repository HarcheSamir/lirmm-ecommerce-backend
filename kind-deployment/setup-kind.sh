#!/bin/bash
set -e

# THIS IS A TEMPORARY SCRIPT FOR A FAST TEST.
# IT FIXES THE 'IMAGE NOT PRESENT LOCALLY' ERROR.

CLUSTER_NAME="lirmm-dev-cluster"
KIND_CONFIG_FILE="./kind-deployment/kind-cluster-config.yaml"
# Test with only one public image to be fast.
PUBLIC_IMAGE_TO_TEST="postgres:15-alpine"

# --- Main Logic ---

echo "--- 1. Creating a fresh, empty Kind cluster ---"
kind delete cluster --name "${CLUSTER_NAME}" || true
kind create cluster --name "${CLUSTER_NAME}" --config="${KIND_CONFIG_FILE}"

echo "--- 2. Pulling the public test image (${PUBLIC_IMAGE_TO_TEST}) ---"
# This is the step that was missing and caused the failure.
docker pull "${PUBLIC_IMAGE_TO_TEST}"

echo "--- 3. Loading the public test image into Kind ---"
# This command will now succeed because the image is present locally.
kind load docker-image --name "${CLUSTER_NAME}" "${PUBLIC_IMAGE_TO_TEST}"

echo ""
echo "##############################################"
echo "###              TEST SUCCEEDED            ###"
echo "### The 'image not present locally' error  ###"
echo "### is fixed.                              ###"
echo "##############################################"