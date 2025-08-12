// This is the final, syntactically correct, idempotent application pipeline.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
    }

    stages {
        stage('Detect Required Updates (from Git & Kubernetes)') {
            steps {
                script {
                    echo "--- Detecting services that require an update ---"
                    env.SERVICES_TO_UPDATE = '' 

                    def servicesToUpdateSet = new HashSet<String>()
                    def allServices = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service'
                    ]

                    echo "--- [1/2] Checking for code changes in Git... ---"
                    def changedFiles = ''
                    try {
                        changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
                    } catch (any) {
                        echo "Could not get git diff, assuming all services need an update."
                        changedFiles = allServices.join('\n')
                    }

                    if (changedFiles) {
                        changedFiles.split('\n').each { filePath ->
                            def serviceDir = filePath.tokenize('/')[0]
                            if (allServices.contains(serviceDir)) {
                                echo "Git change detected in: ${serviceDir}"
                                servicesToUpdateSet.add(serviceDir)
                            }
                        }
                    }

                    echo "--- [2/2] Checking for missing or failed deployments in Kubernetes... ---"
                    def runningDeployments = []
                    try {
                        def deploymentNames = sh(returnStdout: true, script: "kubectl get deployment -n ${env.APP_NAMESPACE} -o jsonpath='{.items[*].metadata.name}'").trim()
                        if (deploymentNames) {
                            runningDeployments = deploymentNames.split(' ')
                        }
                    } catch (any) {
                        echo "Could not get deployments from namespace '${env.APP_NAMESPACE}'. Assuming all services are missing."
                    }
                    
                    allServices.each { service ->
                        def deploymentName = "${service}-deployment"
                        if (!runningDeployments.contains(deploymentName)) {
                            echo "Deployment is missing in cluster: ${deploymentName}"
                            servicesToUpdateSet.add(service)
                        }
                    }

                    if (!servicesToUpdateSet.isEmpty()) {
                        echo "--- FINAL LIST of services to update: ${servicesToUpdateSet.join(', ')} ---"
                        env.SERVICES_TO_UPDATE = servicesToUpdateSet.join(' ')
                    } else {
                        echo "--- No changes detected in Git or the cluster. All services are up-to-date. ---"
                    }
                }
            }
        }

        stage('Build & Load Updated Images') {
            when { expression { env.SERVICES_TO_UPDATE } }
            steps {
                script {
                    def servicesToUpdate = env.SERVICES_TO_UPDATE.split(' ')
                    servicesToUpdate.each { service ->
                        echo "--- Building and loading image for: ${service} ---"
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        sh "docker build -t ${imageName} ./${service}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                }
            }
        }

        stage('Deploy Updated Services') {
            when { expression { env.SERVICES_TO_UPDATE } }
            steps {
                script {
                    def servicesToUpdate = env.SERVICES_TO_UPDATE.split(' ')
                    
                    echo "--- Applying ALL application manifests to create/update objects ---"
                    sh "kubectl apply -f ./kind-deployment/app-manifests.yaml -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart of updated/missing deployments ---"
                    servicesToUpdate.each { service ->
                        def deploymentName = "${service}-deployment"
                        sh "kubectl rollout restart deployment/${deploymentName} -n ${env.APP_NAMESPACE}"
                    }
                    
                    echo "--- Waiting for updated deployments to become available ---"
                    servicesToUpdate.each { service ->
                        def deploymentName = "${service}-deployment"
                        sh "kubectl wait --for=condition=Available deployment/${deploymentName} -n ${env.APP_NAMESPACE} --timeout=15m"
                    }
                }
            }
        }
    }

    // =================================================================
    // KEY CHANGE: The `if/else` logic is now correctly wrapped in a `script` block.
    // =================================================================
    post {
        success {
            script {
                echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
                if (env.SERVICES_TO_UPDATE) {
                    echo "Successfully updated services: ${env.SERVICES_TO_UPDATE}"
                } else {
                    echo "No services required an update."
                }
            }
        }
        failure {
            echo "--- APPLICATION DEPLOYMENT FAILED ---"
        }
    }
}