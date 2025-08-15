// FINAL, CORRECTED, AND SIMPLIFIED Jenkinsfile
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
        stage('Execute Build/Deploy Logic') {
            steps {
                script {
                    if (params.QUICK_RESTART) {
                        echo "--- QUICK RESTART MODE ---"
                        sh "kubectl rollout restart deployment -n ${APP_NAMESPACE} -l app-type=microservice"
                        sh "kubectl rollout status deployment -n ${APP_NAMESPACE} -l app-type=microservice --timeout=10m"
                    } else {
                        // --- BUILD & DEPLOY LOGIC ---
                        
                        // Use 'def' to ensure it's a proper Groovy List
                        def servicesToBuild = []
                        
                        echo "Determining services to build..."
                        if (params.FORCE_REBUILD_ALL) {
                            echo "FORCE_REBUILD_ALL is true. Building all services."
                            servicesToBuild = MICROSERVICES.split(',').toList()
                        } else {
                            try {
                                def changedFiles = sh(
                                    script: 'git diff --name-only ${GIT_PREVIOUS_SUCCESSFUL_COMMIT} ${GIT_COMMIT}',
                                    returnStdout: true
                                ).trim().split('\n')
                                
                                def allServices = MICROSERVICES.split(',')
                                def servicesToBuildSet = new HashSet()
                                
                                allServices.each { service ->
                                    changedFiles.each { file ->
                                        if (file.startsWith("${service}/")) {
                                            servicesToBuildSet.add(service)
                                        }
                                    }
                                }
                                servicesToBuild = new ArrayList(servicesToBuildSet)
                            } catch (e) {
                                echo "First build or error detecting changes. Building all services."
                                servicesToBuild = MICROSERVICES.split(',').toList()
                            }
                        }
                        
                        echo "Services to build: ${servicesToBuild}"

                        // Correct check for an empty list
                        if (servicesToBuild.size() > 0) {
                            echo "Building and pushing images..."
                            def parallelBuilds = [:]
                            servicesToBuild.each { service ->
                                parallelBuilds["Build ${service}"] = {
                                    echo "Building Docker image for ${service}..."
                                    def imageName = "${REGISTRY_HOST}/${IMAGE_PREFIX}/${service}:${IMAGE_TAG}"
                                    dir(service) {
                                        sh "docker build -t ${imageName} ."
                                    }
                                    sh "docker push ${imageName}"
                                }
                            }
                            parallel parallelBuilds
                        } else {
                            echo "No services to build."
                        }

                        echo "Applying Kubernetes manifests and restarting deployments..."
                        sh "kubectl apply -f ${APP_MANIFEST_FILE}"

                        if (servicesToBuild.size() > 0) {
                            echo "Restarting deployments for built services..."
                            servicesToBuild.each { service ->
                                sh "kubectl rollout restart deployment/${service}-deployment -n ${APP_NAMESPACE}"
                            }
                            servicesToBuild.each { service ->
                                sh "kubectl rollout status deployment/${service}-deployment -n ${APP_NAMESPACE} --timeout=5m"
                            }
                        } else {
                            echo "No new deployments to restart."
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