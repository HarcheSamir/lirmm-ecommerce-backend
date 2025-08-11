#!/bin/bash
# kind-deployment/setup-registry.sh
set -e

# This script creates a local Docker registry for use with a Kind cluster.
# The registry runs as a container on the host machine.

# Configuration
REGISTRY_NAME='kind-registry'
REGISTRY_PORT='5001'

echo "--- Setting up local Docker registry ---"

# 1. Start the local registry container if it's not already running
if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
  echo "Starting local Docker registry '${REGISTRY_NAME}' on host port ${REGISTRY_PORT}"
  docker run -d --restart=always -p "${REGISTRY_PORT}:5000" --name "${REGISTRY_NAME}" registry:2
else
  echo "Local registry '${REGISTRY_NAME}' is already running."
fi

echo "--- Registry setup script finished ---"