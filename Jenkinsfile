// This is the final, correct application pipeline. It builds and pushes to a local registry.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
        APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
        REGISTRY_HOST       = 'localhost:5000' // <-- ADDED for clarity and consistency
    }

    stages {
        stage('Build & Push Application Images to Local Registry') { // <-- STAGE RENAMED
            steps {
                script {
                    echo "--- Building and pushing all application service images to local registry ---"
                    // --- List of services is unchanged ---
                    def services = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service', 'notification-service'
                    ]

                    // --- LOGIC CHANGED from 'kind load' to 'docker push' ---
                    services.each { service ->
                        def baseImageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        def registryImageName = "${env.REGISTRY_HOST}/${baseImageName}"

                        echo "--- Building ${baseImageName} ---"
                        sh "docker build -t ${baseImageName} ./${service}"

                        echo "--- Tagging for registry: ${registryImageName} ---"
                        sh "docker tag ${baseImageName} ${registryImageName}"

                        echo "--- Pushing to local registry ---"
                        sh "docker push ${registryImageName}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo "--- Applying ALL application manifests ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart of ONLY microservice deployments ---"
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE} -l app-type=microservice"

                    echo "--- Waiting for microservice deployments to become available ---"
                    sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                }
            }
        }
    }

    post {
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access your services via the Istio Gateway at: http://localhost:13000"
        }
        failure {
            echo "--- APPLICATION DEPLOYMENT FAILED ---"
            echo "--- Dumping pod statuses for debugging ---"
            sh "kubectl get pods -n ${env.APP_NAMESPACE} -o wide"
        }
    }
}