pipeline {
    agent { label 'wsl' }

    environment {
        // Use a real registry for real projects. For local Kind, the registry is the local Docker daemon.
        IMAGE_PREFIX        = 'lirmm-ecommerce' // Your DockerHub username or local prefix
        IMAGE_TAG           = "build-${env.BUILD_NUMBER}" // Use unique tags
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
        APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
        // Define all your microservices here
        MICROSERVICES       = ['api-gateway', 'auth-service', 'cart-service', 'image-service', 'order-service', 'payment-service', 'product-service', 'review-service', 'search-service', 'stats-service']
    }

    parameters {
        booleanParam(name: 'FORCE_REBUILD_ALL', defaultValue: false, description: 'Check this to build and redeploy all services, ignoring git changes.')
        booleanParam(name: 'QUICK_RESTART_ONLY', defaultValue: false, description: 'Check this to only restart app pods (for post-infra-reset), skipping image builds.')
    }

    stages {
        stage('1. Pre-flight Checks') {
            when {
                not { expression { return params.QUICK_RESTART_ONLY } }
            }
            steps {
                script {
                    echo "Checking for Docker and kubectl..."
                    sh 'docker --version'
                    sh 'kubectl version --client'
                }
            }
        }

        stage('2. Detect Changed Services') {
            when {
                not { expression { return params.QUICK_RESTART_ONLY } }
            }
            steps {
                script {
                    // This script block determines which services need to be built.
                    env.SERVICES_TO_BUILD = ''
                    if (params.FORCE_REBUILD_ALL) {
                        echo "FORCE_REBUILD_ALL is true. Building all services."
                        env.SERVICES_TO_BUILD = MICROSERVICES.join(',')
                    } else {
                        echo "Detecting changed services using git..."
                        // Comparing with the previous commit. For PR-based workflows, you'd compare with the target branch (e.g., 'origin/main').
                        def changedFiles = sh(script: 'git diff --name-only HEAD~1 HEAD || true', returnStdout: true).trim().split('\n')
                        def changedServices = []
                        for (service in MICROSERVICES) {
                            // If any changed file starts with the service directory name
                            if (changedFiles.any { it.startsWith("${service}/") }) {
                                echo "Change detected in: ${service}"
                                changedServices.add(service)
                            }
                        }
                        if (changedServices.isEmpty()) {
                            echo "No changes detected in any microservice."
                        } else {
                            env.SERVICES_TO_BUILD = changedServices.join(',')
                        }
                    }
                    if (env.SERVICES_TO_BUILD) {
                        echo "Services to be built and deployed: ${env.SERVICES_TO_BUILD}"
                    }
                }
            }
        }

        stage('3. Build, Push & Load Images') {
            when {
                expression { return env.SERVICES_TO_BUILD }
            }
            steps {
                script {
                    def services = env.SERVICES_TO_BUILD.split(',')
                    def buildStages = [:]

                    for (service in services) {
                        def serviceName = service // new variable for the closure
                        buildStages[serviceName] = {
                            stage("Build: ${serviceName}") {
                                dir(serviceName) {
                                    def imageName = "${IMAGE_PREFIX}/${serviceName}:${IMAGE_TAG}"
                                    echo "Building ${imageName}..."
                                    // Make sure you are logged into docker if pushing to a remote registry
                                    // withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                                    //     sh "docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                                    // }
                                    sh "docker build -t ${imageName} ."

                                    echo "Loading image ${imageName} into Kind cluster..."
                                    // This step is CRITICAL for Kind. It makes the image available inside the cluster.
                                    sh "kind load docker-image ${imageName} --name ${KIND_CLUSTER_NAME}"
                                }
                            }
                        }
                    }
                    parallel buildStages
                }
            }
        }

        stage('4. Deploy to Kubernetes') {
            steps {
                script {
                    if (params.QUICK_RESTART_ONLY) {
                        echo "MODE: QUICK_RESTART_ONLY. Restarting all application deployments..."
                        sh "kubectl rollout restart deployment -n ${APP_NAMESPACE} -l app-type=microservice"

                    } else if (env.SERVICES_TO_BUILD) {
                        echo "Applying base manifests and updating image tags..."
                        // This is a clever trick: we use `sed` to update the image tag for the services we just built,
                        // then apply the result. This avoids checking in version changes.
                        def sedCommands = env.SERVICES_TO_BUILD.split(',').collect {
                            "s|image: ${IMAGE_PREFIX}/${it}:latest|image: ${IMAGE_PREFIX}/${it}:${IMAGE_TAG}|g"
                        }.join('; ')

                        sh "cat ${APP_MANIFEST_FILE} | sed '${sedCommands}' | kubectl apply -n ${APP_NAMESPACE} -f -"
                        
                        echo "Waiting for deployments to stabilize..."
                        def servicesToRollout = env.SERVICES_TO_BUILD.split(',')
                        for (service in servicesToRollout) {
                            sh "kubectl rollout status deployment/${service}-deployment -n ${APP_NAMESPACE} --timeout=5m"
                        }
                    } else {
                       echo "No services were built, skipping deployment."
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