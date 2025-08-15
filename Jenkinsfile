// Jenkinsfile (FINAL CORRECTED VERSION)
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

    // Define a variable here to hold our parallel tasks. It will be accessible by all stages.
    def parallelBuilds = [:]
    def builtServicesList = []

    stages {
        stage('Determine and Prepare Builds') {
            when { expression { !params.QUICK_RESTART } }
            steps {
                script {
                    def servicesToBuild = []
                    if (params.FORCE_REBUILD_ALL) {
                        echo "FORCE_REBUILD_ALL is true. Preparing to build all services."
                        servicesToBuild = MICROSERVICES.split(',')
                    } else {
                        echo "Detecting changed services since last successful build..."
                        // Using try-catch for the very first build where GIT_PREVIOUS_SUCCESSFUL_COMMIT is null
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
                            servicesToBuild = new ArrayList<String>(servicesToBuildSet)
                        } catch (Exception e) {
                            echo "Could not determine changed files (likely the first build). Building all services."
                            servicesToBuild = MICROSERVICES.split(',')
                        }
                    }

                    if (servicesToBuild.isEmpty()) {
                        echo "No changes detected in any microservice directories."
                    } else {
                        echo "Services to be rebuilt: ${servicesToBuild}"
                        builtServicesList.addAll(servicesToBuild) // Store the list for the deployment stage

                        // Populate the parallelBuilds map for the next stage
                        servicesToBuild.each { service ->
                            parallelBuilds["Build ${service}"] = {
                                stage("Build and Push: ${service}") {
                                    echo "Building ${service}..."
                                    def imageName = "${REGISTRY_HOST}/${IMAGE_PREFIX}/${service}:${IMAGE_TAG}"
                                    dir(service) {
                                        sh "docker build -t ${imageName} ."
                                    }
                                    echo "Pushing ${imageName} to local registry..."
                                    sh "docker push ${imageName}"
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Build and Push Images in Parallel') {
            when {
                expression { !params.QUICK_RESTART && !parallelBuilds.isEmpty() }
            }
            steps {
                script {
                    // Execute the map of tasks we built in the previous stage
                    parallel parallelBuilds
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

                        if (!builtServicesList.isEmpty()) {
                            echo "Triggering rollout for newly built services: ${builtServicesList}"
                            builtServicesList.each { service ->
                                sh "kubectl rollout restart deployment/${service}-deployment -n ${APP_NAMESPACE}"
                            }
                            // Wait for the specific rollouts to finish
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

    post {
        success {
            echo "APPLICATION PIPELINE SUCCEEDED."
        }
        failure {
            error "APPLICATION PIPELINE FAILED."
        }
    }
}