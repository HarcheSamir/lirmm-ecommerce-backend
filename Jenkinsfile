pipeline {
    agent any

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = "build-${env.BUILD_NUMBER}"
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        KUBECONFIG_PATH             = "${pwd()}/kubeconfig.internal"
        KUBERNETES_RENDERED_FILE    = "${pwd()}/kind-deployment/kubernetes-manifests-rendered.yaml"
    }

    stages {
        // === NEW, SEPARATE STAGE FOR ALL ONLINE ACTIVITY ===
        stage('Pull Base Images & Build Custom Images') {
            steps {
                script {
                    sh 'chmod +x ./kind-deployment/setup-kind.sh'
                    // Step 1: Pull all public images first, while network is stable.
                    sh './kind-deployment/setup-kind.sh pull_public_images'
                    // Step 2: Build all custom images (which also pulls base images).
                    sh './kind-deployment/setup-kind.sh build_images'
                }
            }
        }

        stage('Create Cluster, Load Images & Deploy') {
            steps {
                script {
                    // Step 3: Now we create the cluster.
                    sh './kind-deployment/setup-kind.sh create_cluster'
                    // Step 4: Load everything from local cache (long-running but offline).
                    sh './kind-deployment/setup-kind.sh load_images'

                    // Step 5: The deployment logic, which is now guaranteed to work.
                    echo "--- Generating and correcting the internal kubeconfig ---"
                    sh """
                        kind get kubeconfig --name ${KIND_CLUSTER_NAME} --internal > ${KUBECONFIG_PATH}
                        KIND_IP=\$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${KIND_CLUSTER_NAME}-control-plane")
                        sed -i "s|server: https://.*:6443|server: https://\${KIND_IP}:6443|g" ${KUBECONFIG_PATH}
                    """
                    echo "--- Rendering Kubernetes Manifest ---"
                    sh """
                        export IMAGE_PREFIX='${env.IMAGE_PREFIX}'
                        export IMAGE_TAG='${env.IMAGE_TAG}'
                        envsubst < ./kind-deployment/kubernetes-manifests.yaml > ${KUBERNETES_RENDERED_FILE}
                    """
                    echo "--- Deploying to Kubernetes ---"
                    docker.image('alpine/k8s:1.27.3').inside("--network kind") {
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f ${KUBERNETES_RENDERED_FILE}"
                        echo "--- Waiting for deployments to become available ---"
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} wait --for=condition=Available --all deployments -n default --timeout=15m"
                    }
                }
            }
        }
    }

    post {
        always {
            sh "rm -f ${KUBECONFIG_PATH} || true"
            sh "rm -f ${KUBERNETES_RENDERED_FILE} || true"
            sh "kind delete cluster --name ${KIND_CLUSTER_NAME} || true"
        }
        success {
            echo "PIPELINE SUCCEEDED"
        }
    }
}