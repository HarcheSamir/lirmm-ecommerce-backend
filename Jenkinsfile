// Jenkinsfile (FINAL, SYNTACTICALLY CORRECT VERSION)
pipeline {
    agent { label 'wsl' }

    environment {
        REGISTRY_HOST       = 'localhost:5000'
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        APP_NAMESPACE       = 'lirmm-services'
        APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
        MICROSERVICES       = 'api-gateway,auth-service,cart-service,image-service,order-service,payment-service,product-service,review-service,search-service,stats-service'
    }

    parameters {
        booleanParam(name: 'FORCE_REBUILD_ALL', defaultValue: false, description: 'Check to ignore change detection and rebuild all services.')
        booleanParam(name: 'QUICK_RESTART', defaultValue: false, description: 'Check this for a fast restart of app pods after an infra data reset.')
    }

    stages {
        stage('Main Build and Deploy Logic') {
            steps {
                // The entire logic is now wrapped in a single `script` block.
                // This is the correct way to manage variables between stages in a Declarative Pipeline.
                script {
                    if (params.QUICK_RESTART) {
                        stage('Quick Restart') {
                            echo "--- QUICK RESTART MODE ---"
                            echo "Performing a rolling restart of all application deployments..."
                            sh "kubectl rollout restart deployment -n ${APP_NAMESPACE} -l app-type=microservice"
                            
                            echo "Waiting for rollout to complete..."
                            sh "kubectl rollout status deployment -n ${APP_NAMESPACE} -l app-type=microservice --timeout=10m"
                        }
                    } else {
                        // --- BUILD & DEPLOY LOGIC ---
                        def builtServicesList = []

                        stage('Determine Services to Build') {
                            if (params.FORCE_REBUILD_ALL) {
                                echo "FORCE_REBUILD_ALL is true. Building all services."
                                builtServicesList = MICROSERVICES.split(',')
                            } else {
                                echo "Detecting changed services since last successful build..."
                                try {
                                    def changedFiles = sh(
                                        script: 'git diff --name-only ${GIT_PREVIOUS_SUCCESSFUL_COMMIT} ${GIT_COMMIT}',
                                        returnStdout: true
                                    ).trim().split('\n')

                                    def services = MICROSERVICES.split(',')
                                    def servicesToBuildSet = new HashSet<String>()

                                    services.each { service ->
                                        changedFiles.each { file ->
                                            if (file.startsWith("${service}/")) {
                                                echo "Change detected in '${service}' due to file: ${file}"
                                                servicesToBuildSet.add(service)
                                            }
                                        }
                                    }
                                    builtServicesList = new ArrayList<String>(servicesToBuildSet)
                                } catch (Exception e) {
                                    echo "Could not determine changed files (likely the first build). Building all services."
                                    builtServicesList = MICROSERVICES.split(',')
                                }
                            }
                            echo "Services to be rebuilt: ${builtServicesList}"
                        }

                        if (!builtServicesList.isEmpty()) {
                            stage('Build and Push Images in Parallel') {
                                def parallelBuilds = [:]
                                builtServicesList.each { service ->
                                    parallelBuilds["Build ${service}"] = {
                                        echo "Building ${service}..."
                                        def imageName = "${REGISTRY_HOST}/${IMAGE_PREFIX}/${service}:${IMAGE_TAG}"
                                        dir(service) {
                                            sh "docker build -t ${imageName} ."
                                        }
                                        echo "Pushing ${imageName} to local registry..."
                                        sh "docker push ${imageName}"
                                    }
                                }
                                parallel parallelBuilds
                            }
                        }

                        stage('Deploy Applications') {
                            echo "--- DEPLOY/UPDATE MODE ---"
                            echo "Applying all application manifests to ensure system is in desired state..."
                            sh "kubectl apply -f ${APP_MANIFEST_FILE}"

                            if (!builtServicesList.isEmpty()) {
                                echo "Triggering rollout for newly built services: ${builtServicesList}"
                                builtServicesList.each { service ->
                                    sh "kubectl rollout restart deployment/${service}-deployment -n ${APP_NAMESPACE}"
                                }
                                echo "Waiting for rollouts to complete..."
                                builtServicesList.each { service ->
                                    sh "kubectl rollout status deployment/${service}-deployment -n ${APP_NAMESPACE} --timeout=5m"
                                }
                            } else {
                                echo "No new images were built. 'kubectl apply' is sufficient."
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "APPLICATION PIPELINE SUCCEEDED."
        }
        failure {
            error "APPLICATION PIPELINE FAILED."
        }
    }
}