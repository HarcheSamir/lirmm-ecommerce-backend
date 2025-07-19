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

        stage('Verify Connection with Correct Docker Image (The Real Test)') {
            steps {
                script {
                    echo "--- Attempting to connect using the CORRECT container image ---"
                    
                    // THE ONLY CHANGE IS THIS LINE:
                    // We use an image designed to work with this Jenkins plugin.
                    docker.image('jenkins/inbound-agent:latest-jdk17').inside("--network kind") {
                        // The kubectl command works here because all the tools from the
                        // host Jenkins environment become available inside.
                        sh "/usr/local/bin/kubectl cluster-info"
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