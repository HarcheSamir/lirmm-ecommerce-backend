pipeline {
    agent any

    environment {
        KIND_CLUSTER_NAME = "lirmm-dev-cluster"
    }

    stages {
        stage('Create Empty Cluster (Fast Test)') {
            steps {
                sh 'chmod +x ./kind-deployment/setup-kind.sh'
                sh './kind-deployment/setup-kind.sh'
            }
        }

        stage('Verify Connection with Docker Plugin (The Real Test)') {
            steps {
                script {
                    echo "--- Attempting to connect to cluster from a container on the 'kind' network ---"
                    
                    // This is the only test that matters. If this block succeeds, the plugin is working correctly.
                    docker.image('bitnami/kubectl:latest').inside("--network kind") {
                        sh "kubectl cluster-info"
                    }

                    echo "--- TEST SUCCEEDED. The connection is working with the plugin. ---"
                }
            }
        }
    }
    
    post {
        always {
            // Always clean up the test cluster.
            echo "--- Cleaning up test cluster ---"
            sh 'kind delete cluster --name ${KIND_CLUSTER_NAME} || true'
        }
    }
}