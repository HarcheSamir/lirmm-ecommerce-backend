// This is YOUR Jenkinsfile, with the one broken command replaced.
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
        stage('Build & Load Application Images') {
            steps {
                script {
                    echo "--- Building and loading all application service images ---"
                    def services = [
                        'api-gateway', 'auth-service', 'product-service', 'image-service',
                        'search-service', 'cart-service', 'order-service', 'review-service',
                        'payment-service', 'stats-service'
                    ]

                    // YOUR ORIGINAL PARALLEL BUILD LOGIC - IT IS CORRECT
                    def parallelBuilds = [:]
                    services.each { service ->
                        parallelBuilds["Build ${service}"] = {
                            def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                            sh "docker build -t ${imageName} ./${service}"
                            sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                        }
                    }
                    parallel parallelBuilds
                }
            }
        }

        // --- THIS IS THE ONLY STAGE THAT HAS BEEN CHANGED ---
        stage('Deploy Application Safely') {
            steps {
                script {
                    echo "--- Applying ALL application manifests ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE}"

                    echo "--- THE FIX: Performing a safe rollout to avoid resource exhaustion ---"
                    
                    echo "--- Step 1: Scaling existing apps to ZERO to free up resources ---"
                    sh "kubectl scale deployment -n ${env.APP_NAMESPACE} --replicas=0 -l app-type=microservice"
                    
                    echo "--- Step 2: Waiting 30 seconds for old pods to terminate completely ---"
                    sleep(30)

                    echo "--- Step 3: Scaling new apps to ONE now that resources are free ---"
                    sh "kubectl scale deployment -n ${env.APP_NAMESPACE} --replicas=1 -l app-type=microservice"

                    echo "--- Waiting for microservice deployments to become available ---"
                    sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m"
                }
            }
        }
    }


    post {
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access your services via the Istio Gateway at: http://localhost:13000"
        }
        failure {
            echo "--- APPLICATION DEPLOYMENT FAILED ---"
            echo "--- Dumping pod statuses for debugging ---"
            sh "kubectl get pods -n ${env.APP_NAMESPACE} -o wide"
        }
    }
}