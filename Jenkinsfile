// THIS IS THE FINAL, CORRECTED, SPECIFIC PIPELINE.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = 'latest'
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        APP_NAMESPACE               = 'lirmm-services'
        INFRA_MANIFEST_FILE         = './kind-deployment/infra-manifests.yaml'
        APP_MANIFEST_FILE           = './kind-deployment/app-manifests.yaml'
    }

    stages {
        stage('Deploy Infrastructure') {
            steps {
                script {
                    echo "--- Ensuring namespace '${env.APP_NAMESPACE}' exists ---"
                    sh "kubectl create namespace ${env.APP_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                    echo "--- Applying infrastructure manifests to namespace: ${env.APP_NAMESPACE} ---"
                    sh "kubectl apply -f ${env.INFRA_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
                    
                    echo "--- Waiting ONLY for the database to be ready ---"
                    // THIS IS THE FIX: Wait specifically for the deployment created in THIS stage.
                    sh "kubectl wait --for=condition=Available deployment/auth-db-deployment -n ${env.APP_NAMESPACE} --timeout=5m"
                }
            }
        }

        stage('Build & Load Application Images') {
            steps {
                script {
                    echo "--- Building and loading application service images ---"
                    def services = ['api-gateway', 'auth-service']

                    services.each { service ->
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        echo "Building ${imageName}"
                        sh "docker build -t ${imageName} ./${service}"

                        echo "Loading ${imageName} into Kind"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo "--- Applying application manifests to namespace: ${env.APP_NAMESPACE} ---"
                    sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart of all microservice deployments ---"
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE}"

                    echo "--- Waiting for the new rollout of ALL applications to become available ---"
                    sh "kubectl wait --for=condition=Available --all deployments -n ${env.APP_NAMESPACE} --timeout=15m"
                }
            }
        }
    }

    post {
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access your services via the Istio Gateway at: http://localhost:13000"
        }
    }
}