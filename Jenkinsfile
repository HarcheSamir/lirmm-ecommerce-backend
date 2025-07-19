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

        stage('Verify Connection with Correct Image (This is it)') {
            steps {
                script {
                    echo "--- Attempting connection using the correct, kubectl-enabled image ---"
                    
                    // THIS IS THE FINAL, CORRECTED LINE:
                    // Using an image that is guaranteed to contain kubectl and stay running.
                    docker.image('alpine/k8s:1.27.3').inside("--network kind") {
                        sh "kubectl cluster-info"
                    }

                    echo "--- TEST SUCCEEDED. The connection is working. ---"
                }
            }
        }
    }
    
    post {
        always {
            echo "--- Cleaning up test cluster ---"
            sh 'kind delete cluster --name ${KIND_CLUSTER_NAME} || true'
        }
    }
}