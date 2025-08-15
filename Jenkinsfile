// Jenkinsfile
pipeline {
    agent { label 'wsl' }

    environment {
        REGISTRY_HOST       = 'localhost:5000'
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        APP_NAMESPACE       = 'lirmm-services'
        APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
        // Define all your microservice directories here
        MICROSERVICES       = 'api-gateway,auth-service,cart-service,image-service,order-service,payment-service,product-service,review-service,search-service,stats-service'
    }

    parameters {
        booleanParam(name: 'FORCE_REBUILD_ALL', defaultValue: false, description: 'Check to ignore change detection and rebuild all services.')
        booleanParam(name: 'QUICK_RESTART', defaultValue: false, description: 'Check this for a fast restart of app pods after an infra data reset.')
    }

    stages {
        stage('Determine Services to Build') {
            // This stage is skipped for a quick restart
            when { expression { !params.QUICK_RESTART } }
            steps {
                script {
                    env.SERVICES_TO_BUILD = []
                    if (params.FORCE_REBUILD_ALL) {
                        echo "FORCE_REBUILD_ALL is true. Building all services."
                        env.SERVICES_TO_BUILD = MICROSERVICES.split(',')
                    } else {
                        echo "Detecting changed services since last successful build..."
                        def changedFiles = sh(
                            script: 'git diff --name-only ${GIT_PREVIOUS_SUCCESSFUL_COMMIT} ${GIT_COMMIT}',
                            returnStdout: true
                        ).trim().split('\n')

                        def services = MICROSERVICES.split(',')
                        def servicesToBuildSet = new HashSet<String>()

                        services.each { service ->
                            changedFiles.each { file ->
                                // If a changed file is in a service's directory, add it to the build set
                                if (file.startsWith("${service}/")) {
                                    echo "Change detected in '${service}' due to file: ${file}"
                                    servicesToBuildSet.add(service)
                                }
                            }
                        }
                        
                        // Check if this is the first ever run
                        if (currentBuild.previousBuild == null) {
                            echo "First build detected. Building all services."
                            servicesToBuildSet.addAll(services)
                        }

                        if (servicesToBuildSet.isEmpty()) {
                            echo "No changes detected in any microservice directories."
                        } else {
                            env.SERVICES_TO_BUILD = new ArrayList<String>(servicesToBuildSet)
                        }
                    }
                    echo "Services to be rebuilt: ${env.SERVICES_TO_BUILD}"
                }
            }
        }

        stage('Build and Push Images') {
            // This stage is skipped for a quick restart
            when { 
                expression { !params.QUICK_RESTART && env.SERVICES_TO_BUILD && !env.SERVICES_TO_BUILD.isEmpty() } 
            }
            steps {
                script {
                    def services = env.SERVICES_TO_BUILD
                    parallel services.collectEntries { service ->
                        ["Build ${service}": {
                            stage("Build and Push: ${service}") {
                                echo "Building ${service}..."
                                def imageName = "${REGISTRY_HOST}/${IMAGE_PREFIX}/${service}:${IMAGE_TAG}"
                                dir(service) {
                                    sh "docker build -t ${imageName} ."
                                }
                                echo "Pushing ${imageName} to local registry..."
                                sh "docker push ${imageName}"
                            }
                        }]
                    }
                }
            }
        }

        stage('Deploy or Restart Applications') {
            steps {
                script {
                    if (params.QUICK_RESTART) {
                        echo "--- QUICK RESTART MODE ---"
                        echo "Performing a rolling restart of all application deployments..."
                        sh "kubectl rollout restart deployment -n ${APP_NAMESPACE} -l app-type=microservice"
                        
                        echo "Waiting for rollout to complete..."
                        sh "kubectl rollout status deployment -n ${APP_NAMESPACE} -l app-type=microservice --timeout=10m"

                    } else {
                        echo "--- DEPLOY/UPDATE MODE ---"
                        echo "Applying all application manifests to ensure system is in desired state..."
                        sh "kubectl apply -f ${APP_MANIFEST_FILE}"

                        // If we built new images, we must trigger a rollout to make Kubernetes use them.
                        if (env.SERVICES_TO_BUILD && !env.SERVICES_TO_BUILD.isEmpty()) {
                            echo "Triggering rollout for newly built services: ${env.SERVICES_TO_BUILD}"
                            env.SERVICES_TO_BUILD.each { service ->
                                sh "kubectl rollout restart deployment/${service}-deployment -n ${APP_NAMESPACE}"
                            }
                            // Wait for the specific rollouts to finish
                            env.SERVICES_TO_BUILD.each { service ->
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

    post {
        success {
            echo "APPLICATION PIPELINE SUCCEEDED."
        }
        failure {
            error "APPLICATION PIPELINE FAILED."
        }
    }
}