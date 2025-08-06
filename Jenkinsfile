// This is the final, correct application pipeline. It applies your proven sequential wait logic.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
        APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
    }

    stages {
        stage('Build & Load Application Images') {
            steps {
                script {
                    echo "--- Building and loading all application service images ---"
                    def services = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service'
                    ]

                    services.each { service ->
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        echo "Building ${imageName}"
                        sh "docker build -t ${imageName} ./${service}"

                        echo "Loading ${imageName} into Kind"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo "--- Applying ALL application manifests ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart to ensure changes are picked up ---"
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE}"

                    echo "--- Waiting for deployments to become available SEQUENTIALLY ---"
                    // THIS IS THE FIX: Wait for each deployment individually to avoid overwhelming the control plane.
                    sh "kubectl wait --for=condition=Available deployment/api-gateway-deployment -n ${env.APP_NAMESPACE} --timeout=3m"
                    sh "kubectl wait --for=condition=Available deployment/auth-service-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
                    sh "kubectl wait --for=condition=Available deployment/product-service-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
                    sh "kubectl wait --for=condition=Available deployment/image-service-deployment -n ${env.APP_NAMESPACE} --timeout=3m"
                    sh "kubectl wait --for=condition=Available deployment/search-service-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
                    sh "kubectl wait --for=condition=Available deployment/cart-service-deployment -n ${env.APP_NAMESPACE} --timeout=3m"
                    sh "kubectl wait --for=condition=Available deployment/order-service-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
                    sh "kubectl wait --for=condition=Available deployment/review-service-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
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