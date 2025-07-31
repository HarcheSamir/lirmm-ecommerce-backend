// THIS IS THE FAST, FREQUENTLY RUN PIPELINE FOR APPLICATION DEPLOYMENT
// It now uses a static ':latest' tag and explicitly forces a rollout to deploy new code.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = 'latest'
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        APP_MANIFEST_FILE           = './kind-deployment/app-manifests.yaml'
        APP_RENDERED_FILE           = "./kind-deployment/app-manifests-rendered.yaml"
    }

    stages {
        stage('Build & Load Application Images') {
            steps {
                script {
                    echo "--- Building and loading application service images with tag: ${env.IMAGE_TAG} ---"
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
                    echo "--- Applying configuration to ensure it's up-to-date ---"
                    sh "envsubst '\\\$IMAGE_PREFIX,\\\$IMAGE_TAG' < ${env.APP_MANIFEST_FILE} > ${env.APP_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.APP_RENDERED_FILE}"

                    // THIS IS THE FIX:
                    // Force a rolling restart of all microservice deployments.
                    // This command ensures that Kubernetes terminates the old pods and creates
                    // new ones, which will then use the new ':latest' image.
                    echo "--- Forcing rollout restart of all microservices ---"
                    sh "kubectl rollout restart deployment -l app-type=microservice"

                    echo "--- Waiting for the new rollout to become available ---"
                    sh "kubectl wait --for=condition=Available --all deployments -l app-type=microservice -n default --timeout=15m"
                }
            }
        }
    }

    post {
        always {
            sh "rm -f ${env.APP_RENDERED_FILE} || true"
        }
        success {
            echo "--- Cleaning up old, untagged Docker images ---"
            sh "docker image prune -f"

            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access API Gateway at: http://localhost:13000"
            echo "Access Consul UI at: http://localhost:18500"
        }
    }
}