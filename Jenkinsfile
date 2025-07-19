pipeline {
    // Uses the main Jenkins container. No agents.
    agent any

    environment {
        KIND_CLUSTER_NAME = "lirmm-dev-cluster"
    }

    stages {
        stage('Create Empty Cluster (Fast Test)') {
            steps {
                // This script now ONLY creates the cluster. It will be fast.
                sh 'chmod +x ./kind-deployment/setup-kind.sh'
                sh './kind-deployment/setup-kind.sh'
            }
        }

        stage('Verify Connection (The Real Test)') {
            steps {
                script {
                    echo "--- Attempting to connect to cluster from a container on the 'kind' network ---"
                    
                    // THIS IS THE FIX: Run kubectl from a temporary container that is
                    // explicitly attached to the 'kind' network. From here, it can see
                    // and connect to the cluster's control-plane container.
                    docker.image('bitnami/kubectl:latest').inside("--network kind") {
                        // This command is the only test we need. If it passes, the problem is solved.
                        sh "kubectl cluster-info"
                    }

                    echo "--- TEST SUCCEEDED. The connection is working. ---"
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