// This is the final, correct, and intelligent application pipeline.
// It builds only what's needed and finishes with a refresh to handle state wipes.
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
        stage('Detect Required Updates (Git & Kubernetes)') {
            steps {
                script {
                    echo "--- Detecting services that require an update ---"
                    env.SERVICES_TO_BUILD = '' // Services with code changes
                    
                    def servicesToBuildSet = new HashSet<String>()
                    def allServices = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service'
                    ]

                    // Check Git for code changes. This is the only check that triggers a build.
                    echo "--- Checking for code changes in Git... ---"
                    try {
                        def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
                        if (changedFiles) {
                            changedFiles.split('\n').each { filePath ->
                                def serviceDir = filePath.tokenize('/')[0]
                                if (allServices.contains(serviceDir)) {
                                    echo "Git change detected in: ${serviceDir}"
                                    servicesToBuildSet.add(serviceDir)
                                }
                            }
                        }
                    } catch (any) {
                        echo "Could not get git diff, assuming all services are new and need to be built."
                        servicesToBuildSet.addAll(allServices)
                    }

                    if (!servicesToBuildSet.isEmpty()) {
                        env.SERVICES_TO_BUILD = servicesToBuildSet.join(' ')
                        echo "--- Services to BUILD: ${env.SERVICES_TO_BUILD} ---"
                    } else {
                        echo "--- No code changes detected in any service directories. ---"
                    }
                }
            }
        }

        stage('Build & Load Changed Images') {
            // This stage ONLY runs if there were code changes.
            when { expression { env.SERVICES_TO_BUILD } }
            steps {
                script {
                    def servicesToBuild = env.SERVICES_TO_BUILD.split(' ')
                    servicesToBuild.each { service ->
                        echo "--- Building and loading image for changed service: ${service} ---"
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        sh "docker build -t ${imageName} ./${service}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                }
            }
        }

        // This final stage runs every time. It is the key to your "Hot Refresh" workflow.
        // It ensures everything is running and correctly initialized.
        stage('Deploy & Refresh All Application Services') {
            steps {
                script {
                    echo "--- Applying ALL application manifests to ensure objects exist/are updated ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
                    sleep 10 // Give the API server a moment to process the apply

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