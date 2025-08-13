// This is the final, truly idempotent, and NON-HARDCODED application pipeline.
// It dynamically handles both Deployments and StatefulSets.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX        = 'lirmm-ecommerce'
        IMAGE_TAG           = 'latest'
        KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
        APP_NAMESPACE       = 'lirmm-services'
    }

    stages {
        // This stage is correct and remains unchanged
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
                    } catch (any) { /* Do nothing */ }
                    
                    allServices.each { service ->
                        if (!existingObjects.contains(service)) { servicesToUpdateSet.add(service) }
                    }

                    if (!servicesToUpdateSet.isEmpty()) {
                        env.SERVICES_TO_UPDATE = servicesToUpdateSet.join(' ')
                        echo "--- FINAL LIST of services to update: ${env.SERVICES_TO_UPDATE} ---"
                    } else {
                        echo "--- No changes detected in Git or the cluster. ---"
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
        // KEY CHANGE: This stage is now GENERIC. NO HARDCODING.
        // It tries to restart both kinds of objects for each service.
        // =================================================================
        stage('Deploy Updated Services') {
            when { expression { env.SERVICES_TO_UPDATE } }
            steps {
                script {
                    def servicesToUpdate = env.SERVICES_TO_UPDATE.split(' ')
                    
                    echo "--- Applying ALL application manifests to create/update objects ---"
                    sh "kubectl apply -f ./kind-deployment/app-manifests.yaml -n ${env.APP_NAMESPACE}"

                    // Add a small sleep to give the Kubernetes API a moment to process the apply.
                    // This helps prevent race conditions.
                    sleep 10

                    echo "--- Forcing rollout restart of updated/missing objects ---"
                    servicesToUpdate.each { service ->
                        echo "--- Restarting any workload for service: ${service} ---"
                        // Try to restart a Deployment. If it doesn't exist, this will do nothing and succeed.
                        sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE} -l app=${service} --ignore-not-found=true"
                        // Try to restart a StatefulSet. If it doesn't exist, this will do nothing and succeed.
                        sh "kubectl rollout restart statefulset -n ${env.APP_NAMESPACE} -l app=${service} --ignore-not-found=true"
                    }
                    
                    echo "--- Waiting for updated objects to become available ---"
                    servicesToUpdate.each { service ->
                        echo "--- Waiting for workload of service: ${service} ---"
                        // Wait for a Deployment. If none exists, this will do nothing and succeed.
                        sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app=${service} --timeout=15m --ignore-not-found=true"
                        // Wait for a StatefulSet. If none exists, this will do nothing and succeed.
                        sh "kubectl rollout status statefulset -n ${env.APP_NAMESPACE} -l app=${service} --timeout=15m --ignore-not-found=true"
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