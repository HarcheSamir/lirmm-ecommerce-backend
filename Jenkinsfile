pipeline {
    agent any

    environment {
        KIND_CLUSTER_NAME = "lirmm-dev-cluster"
        // This path must be absolute to work with volume mounts
        KUBECONFIG_PATH   = "${pwd()}/kubeconfig.internal"
    }

    stages {
        stage('Create Empty Cluster (Fast Test)') {
            steps {
                sh 'chmod +x ./kind-deployment/setup-kind.sh'
                sh './kind-deployment/setup-kind.sh'
            }
        }

        stage('Generate Config and Verify Connection (Final Test)') {
            steps {
                script {
                    echo "--- Generating and correcting the internal kubeconfig ---"
                    sh """
                        kind get kubeconfig --name ${KIND_CLUSTER_NAME} --internal > ${KUBECONFIG_PATH}
                        KIND_IP=\$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${KIND_CLUSTER_NAME}-control-plane")
                        sed -i "s|server: https://.*:6443|server: https://\${KIND_IP}:6443|g" ${KUBECONFIG_PATH}
                    """

                    echo "--- Attempting connection using corrected kubeconfig ---"
                    docker.image('alpine/k8s:1.27.3').inside("--network kind") {
                        // THIS IS THE FIX: We explicitly tell the command to use
                        // the kubeconfig from the mounted workspace.
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} cluster-info"
                    }

                    echo "--- TEST SUCCEEDED. The connection is working. ---"
                }
            }
        }
    }
    
    post {
        always {
            echo "--- Cleaning up test cluster and config file ---"
            sh 'kind delete cluster --name ${KIND_CLUSTER_NAME} || true'
            sh "rm -f ${KUBECONFIG_PATH} || true"
        }
    }
}