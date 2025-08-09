#!/bin/bash
set -e

# THIS IS THE FIRST FIX:
# The image names are now listed exactly as they should be pulled.
PUBLIC_IMAGES=(
    'postgres:15-alpine'
    'confluentinc/cp-zookeeper:7.3.2'
    'confluentinc/cp-kafka:7.3.2'
    'docker.elastic.co/elasticsearch/elasticsearch:8.11.1'
    'redis:7.2-alpine'
    'istio/pilot:1.26.3'
    'istio/proxyv2:1.26.3'
)

LOCAL_REGISTRY="localhost:5000"

echo "--- Populating local registry at ${LOCAL_REGISTRY} ---"

for image in "${PUBLIC_IMAGES[@]}"; do
    
    # THIS IS THE SECOND, CRITICAL FIX:
    # This logic correctly determines the full image name without making mistakes.
    # If the first part of the name contains a dot (like docker.elastic.co), it's a full URL.
    # Otherwise, we assume it's on the default Docker Hub.
    if [[ $(echo "$image" | cut -d'/' -f1) == *.* ]]; then
        REMOTE_IMAGE_NAME="$image"
    else
        REMOTE_IMAGE_NAME="docker.io/${image}"
    fi

    echo "Processing image: ${REMOTE_IMAGE_NAME}"
    
    # Pull the original image from the correct remote location
    docker pull "${REMOTE_IMAGE_NAME}"
    
    # Tag it for the local registry
    docker tag "${REMOTE_IMAGE_NAME}" "${LOCAL_REGISTRY}/${image}"
    
    # Push it to the local registry
    docker push "${LOCAL_REGISTRY}/${image}"
    
    echo "Successfully pushed ${LOCAL_REGISTRY}/${image}"
    echo "------------------------------------------------"
done

echo "--- Local registry population complete. ---"
echo "--- You can now re-run the Infrastructure pipeline in Jenkins. ---"