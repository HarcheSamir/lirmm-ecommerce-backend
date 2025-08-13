// This is the final, truly idempotent application pipeline.
// It GENERICALLY handles both Deployments and StatefulSets without hardcoding.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
    }

    stages {
        // This stage is already correct and remains unchanged
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

                    // Check 1: Git changes
                    def changedFiles = ''
                    try {
                        changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD').trim()
                    } catch (any) {
                        changedFiles = allServices.join('\n')
                    }
                    if (changedFiles) {
                        changedFiles.split('\n').each { filePath ->
                            def serviceDir = filePath.tokenize('/')[0]
                            if (allServices.contains(serviceDir)) { servicesToUpdateSet.add(serviceDir) }
                        }
                    }

                    // Check 2: Missing Kubernetes objects
                    def existingObjects = []
                    try {
                        def deploymentApps = sh(returnStdout: true, script: "kubectl get deployment -n ${env.APP_NAMESPACE} -o jsonpath='{.items[*].metadata.labels.app}'").trim()
                        def statefulSetApps = sh(returnStdout: true, script: "kubectl get statefulset -n ${env.APP_NAMESPACE} -o jsonpath='{.items[*].metadata.labels.app}'").trim()
                        if (deploymentApps) { existingObjects.addAll(deploymentApps.split(' ')) }
                        if (statefulSetApps) { existingObjects.addAll(statefulSetApps.split(' ')) }
                    } catch (any) { /* Do nothing, list remains empty */ }
                    
                    allServices.each { service ->
                        if (!existingObjects.contains(service)) { servicesToUpdateSet.add(service) }
                    }

                    if (!servicesToUpdateSet.isEmpty()) {
                        env.SERVICES_TO_UPDATE = servicesToUpdateSet.join(' ')
                    }
                }
            }
        }

        // This stage is correct and remains unchanged
        stage('Build & Load Updated Images') {
            when { expression { env.SERVICES_TO_UPDATE } }
            steps {
                script {
                    def servicesToUpdate = env.SERVICES_TO_UPDATE.split(' ')
                    servicesToUpdate.each { service ->
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        sh "docker build -t ${imageName} ./${service}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                }
            }
        }

        // =================================================================
        // KEY CHANGE: This stage now dynamically finds and restarts the correct object type.
        // NO MORE HARDCODING.
        // =================================================================
        stage('Deploy Updated Services') {
            when { expression { env.SERVICES_TO_UPDATE } }
            steps {
                script {
                    def servicesToUpdate = env.SERVICES_TO_UPDATE.split(' ')
                    
                    echo "--- Applying ALL application manifests to create/update objects ---"
                    sh "kubectl apply -f ./kind-deployment/app-manifests.yaml -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart of updated/missing objects ---"
                    servicesToUpdate.each { service ->
                        // Ask Kubernetes if a Deployment exists for this service
                        def deploymentName = sh(returnStdout: true, script: "kubectl get deployment -n ${env.APP_NAMESPACE} -l app=${service} -o jsonpath='{.items[0].metadata.name}'").trim()
                        
                        if (deploymentName) {
                            echo "Found Deployment '${deploymentName}' for service '${service}'. Restarting."
                            sh "kubectl rollout restart deployment/${deploymentName} -n ${env.APP_NAMESPACE}"
                        } else {
                            // If not, ask Kubernetes if a StatefulSet exists for this service
                            def statefulSetName = sh(returnStdout: true, script: "kubectl get statefulset -n ${env.APP_NAMESPACE} -l app=${service} -o jsonpath='{.items[0].metadata.name}'").trim()
                            if (statefulSetName) {
                                echo "Found StatefulSet '${statefulSetName}' for service '${service}'. Restarting."
                                sh "kubectl rollout restart statefulset/${statefulSetName} -n ${env.APP_NAMESPACE}"
                            } else {
                                echo "WARNING: Could not find a Deployment or StatefulSet for service '${service}'. Cannot restart."
                            }
                        }
                    }
                    
                    echo "--- Waiting for updated objects to become available ---"
                    servicesToUpdate.each { service ->
                        def deploymentName = sh(returnStdout: true, script: "kubectl get deployment -n ${env.APP_NAMESPACE} -l app=${service} -o jsonpath='{.items[0].metadata.name}'").trim()
                        if (deploymentName) {
                            echo "Waiting for Deployment: ${deploymentName}"
                            sh "kubectl wait --for=condition=Available deployment/${deploymentName} -n ${env.APP_NAMESPACE} --timeout=15m"
                        } else {
                            def statefulSetName = sh(returnStdout: true, script: "kubectl get statefulset -n ${env.APP_NAMESPACE} -l app=${service} -o jsonpath='{.items[0].metadata.name}'").trim()
                            if (statefulSetName) {
                                echo "Waiting for StatefulSet rollout: ${statefulSetName}"
                                sh "kubectl rollout status statefulset/${statefulSetName} -n ${env.APP_NAMESPACE} --timeout=15m"
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        // This post block is correct and remains unchanged
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