#!/bin/bash
set -e

# Define the public images your infrastructure depends on
PUBLIC_IMAGES=(
    'postgres:15-alpine'
    'confluentinc/cp-zookeeper:7.3.2'
    'confluentinc/cp-kafka:7.3.2'
    'docker.elastic.co/elasticsearch/elasticsearch:8.11.1'
    'redis:7.2-alpine'
)

LOCAL_REGISTRY="localhost:5000"

echo "--- Populating local registry at ${LOCAL_REGISTRY} ---"

for image in "${PUBLIC_IMAGES[@]}"; do
    echo "Processing image: ${image}"
    
    # Pull the original image
    docker pull "${image}"
    
    # Tag it for the local registry
    docker tag "${image}" "${LOCAL_REGISTRY}/${image}"
    
    # Push it to the local registry
    docker push "${LOCAL_REGISTRY}/${image}"
    
    echo "Successfully pushed ${LOCAL_REGISTRY}/${image}"
    echo "------------------------------------------------"
done

echo "--- Local registry population complete. ---"
