// This Jenkinsfile is designed for a local CI/CD process to deploy to Kind.
// It assumes the Jenkins agent has access to Docker, kubectl, and kind.
pipeline {
    agent any

    environment {
        // These environment variables are passed down to the shell script.
        // Jenkins automatically provides a unique BUILD_NUMBER.
        IMAGE_TAG    = "build-${BUILD_NUMBER}"
        IMAGE_PREFIX = 'lirmm-ecommerce'
        CLUSTER_NAME = 'lirmm-dev-cluster'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                // Fetches the code from the Git repository configured in the Jenkins job.
                checkout scm
            }
        }

        stage('Build, Load, and Deploy to Kubernetes') {
            steps {
                script {
                    try {
                        echo "Starting full build and deploy process..."
                        // Grant execute permissions to the main script and run it.
                        sh 'chmod +x ./kind-deployment/setup-kind.sh'
                        sh './kind-deployment/setup-kind.sh'
                    } catch (e) {
                        echo "Pipeline execution failed: ${e.message}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Pipeline finished with status: ${currentBuild.currentResult}"
                echo "To manually remove the Kubernetes cluster, run: kind delete cluster --name ${env.CLUSTER_NAME}"
            }
        }
    }
}