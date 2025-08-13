// This is the final, correct, and intelligent application pipeline.
// It builds only what's needed and finishes with a full application refresh.
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
        stage('Detect & Build Changed Services') {
            steps {
                script {
                    echo "--- Detecting services with code changes ---"
                    def servicesToBuild = new HashSet<String>()
                    def allServices = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service'
                    ]

                    // Check Git for code changes. This is the only check that triggers a build.
                    try {
                        def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
                        if (changedFiles) {
                            changedFiles.split('\n').each { filePath ->
                                def serviceDir = filePath.tokenize('/')[0]
                                if (allServices.contains(serviceDir)) {
                                    servicesToBuild.add(serviceDir)
                                }
                            }
                        }
                    } catch (any) {
                        echo "Could not get git diff, assuming all services are new and need to be built."
                        servicesToBuild.addAll(allServices)
                    }

                    if (!servicesToBuild.isEmpty()) {
                        echo "--- Services to BUILD: ${servicesToBuild.join(', ')} ---"
                        servicesToBuild.each { service ->
                            echo "--- Building and loading image for changed service: ${service} ---"
                            def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                            sh "docker build -t ${imageName} ./${service}"
                            sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                        }
                    } else {
                        echo "--- No code changes detected in any service directories. No images will be built. ---"
                    }
                }
            }
        }

        // This final stage runs every time to handle your "Hot Refresh" workflow.
        // It ensures everything is running and correctly initialized after a potential infra reset.
        stage('Deploy & Refresh All Application Services') {
            steps {
                script {
                    echo "--- Applying ALL application manifests to ensure objects exist/are updated ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
                    sleep 15 // Give the API server a moment to process the apply and prevent race conditions.

                    echo "--- Restarting ALL application services to apply changes and run migrations/init ---"
                    // This is robust and non-hardcoded. It restarts anything with the right label.
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE} -l app-type=microservice"
                    sh "kubectl rollout restart statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice"
                    
                    echo "--- Waiting for ALL applications to become available ---"
                    sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                    sh "kubectl rollout status statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                }
            }
        }
    }

    post {
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
        }
        failure {
            echo "--- APPLICATION DEPLOYMENT FAILED ---"
        }
    }
}