// THIS IS THE FAST, FREQUENTLY RUN PIPELINE FOR APPLICATION DEPLOYMENT
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = "build-${env.BUILD_NUMBER}"
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        APP_MANIFEST_FILE           = './kind-deployment/app-manifests.yaml'
        APP_RENDERED_FILE           = "./kind-deployment/app-manifests-rendered.yaml"
    }

    stages {
        stage('Build & Load Application Images') {
            steps {
                script {
                    echo "--- Building and loading application service images ---"
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
                    echo "--- Deploying application to Kind cluster ---"
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.APP_MANIFEST_FILE} > ${env.APP_RENDERED_FILE}"
                    
                    sh "kubectl apply -f ${env.APP_RENDERED_FILE}"

                    echo "--- Waiting for application deployments to become available ---"
                    sh "kubectl wait --for=condition=Available --all deployments -l app-type=microservice -n default --timeout=15m"
                }
            }
        }
    }

    post {
        always {
            sh "rm -f ${env.APP_RENDERED_FILE} || true"
            echo "Kind cluster '${env.KIND_CLUSTER_NAME}' is running with the updated application."
        }
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access API Gateway at: http://localhost:13000"
            echo "Access Consul UI at: http://localhost:18500"
        }
    }
}