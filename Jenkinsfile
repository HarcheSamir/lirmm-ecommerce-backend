// Fixed application pipeline that builds only changed services and always restarts for fresh init
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
        stage('Build Required Services') {
            steps {
                script {
                    echo "--- Checking which services need to be built ---"
                    def servicesToBuild = new HashSet<String>()
                    def allServices = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service'
                    ]

                    // First, check for code changes
                    try {
                        def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
                        if (changedFiles) {
                            changedFiles.split('\n').each { filePath ->
                                def serviceDir = filePath.tokenize('/')[0]
                                if (allServices.contains(serviceDir)) {
                                    servicesToBuild.add(serviceDir)
                                }
                            }
                            echo "--- Services with code changes: ${servicesToBuild.join(', ')} ---"
                        }
                    } catch (any) {
                        echo "Could not get git diff, will check for missing images."
                    }

                    // Check if images exist in Kind cluster, build missing ones
                    echo "--- Checking for missing images in Kind cluster ---"
                    allServices.each { service ->
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        def imageExists = sh(returnStatus: true, script: "docker exec ${env.KIND_CLUSTER_NAME}-control-plane crictl images | grep -q '${imageName}'")
                        
                        if (imageExists != 0) {
                            echo "--- Image missing for ${service}, will build ---"
                            servicesToBuild.add(service)
                        }
                    }

                    if (!servicesToBuild.isEmpty()) {
                        echo "--- Services to BUILD: ${servicesToBuild.join(', ')} ---"
                        servicesToBuild.each { service ->
                            echo "--- Building and loading image for service: ${service} ---"
                            def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                            sh "docker build -t ${imageName} ./${service}"
                            sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                        }
                    } else {
                        echo "--- All required images exist in cluster. No builds needed. ---"
                    }
                }
            }
        }

        stage('Deploy & Fresh Restart All Services') {
            steps {
                script {
                    echo "--- Applying ALL application manifests to ensure objects exist/are updated ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
                    
                    // Give the API server a moment to process the apply
                    sleep 10

                    echo "--- Performing fresh restart of ALL application services ---"
                    echo "--- This ensures fresh initialization, migrations, and seeding after volume clearing ---"
                    
                    // Restart all microservice deployments
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE} -l app-type=microservice"
                    
                    // Restart all microservice statefulsets
                    sh "kubectl rollout restart statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice"

                    echo "--- Waiting for ALL applications to become available ---"
                    sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                    sh "kubectl rollout status statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                    
                    echo "--- Fresh restart complete - all services initialized with clean data ---"
                }
            }
        }
    }

    post {
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "--- All services are running with fresh initialization. Prisma migrations and seeding completed. ---"
        }
        failure {
            echo "--- APPLICATION DEPLOYMENT FAILED ---"
        }
    }
}