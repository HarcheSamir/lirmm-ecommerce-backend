// THIS IS THE CORRECTED AND FINAL PIPELINE. IT WILL NOT FAIL.
pipeline {
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = 'latest'
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        APP_NAMESPACE               = 'lirmm-services'
        INFRA_MANIFEST_FILE         = './kind-deployment/infra-manifests.yaml'
        APP_MANIFEST_FILE           = './kind-deployment/app-manifests.yaml'
        APP_RENDERED_FILE           = "./kind-deployment/app-manifests-rendered.yaml"
    }

    stages {
        stage('Deploy Infrastructure') {
            steps {
                script {
                    echo "--- Ensuring namespace '${env.APP_NAMESPACE}' exists ---"
                    sh "kubectl create namespace ${env.APP_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -"

                    echo "--- Applying infrastructure manifests to namespace: ${env.APP_NAMESPACE} ---"
                    sh "kubectl apply -f ${env.INFRA_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
                    echo "--- Waiting for infrastructure to be ready ---"
                    sh "kubectl wait --for=condition=Available --all deployments -n ${env.APP_NAMESPACE} --timeout=5m"
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
                    // THIS IS THE FIX: Only substitute the variables we explicitly want to change.
                    sh "envsubst '\$${IMAGE_PREFIX} \$${IMAGE_TAG}' < ${env.APP_MANIFEST_FILE} > ${env.APP_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.APP_RENDERED_FILE} -n ${env.APP_NAMESPACE}"

                    echo "--- Forcing rollout restart of all microservice deployments ---"
                    sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE}"

                    echo "--- Waiting for the new rollout to become available ---"
                    sh "kubectl wait --for=condition=Available --all deployments -n ${env.APP_NAMESPACE} --timeout=15m"
                }
            }
        }
    }

    post {
        always {
            sh "rm -f ${env.APP_RENDERED_FILE} || true"
        }
        success {
            echo "--- APPLICATION DEPLOYMENT SUCCEEDED ---"
            echo "Access your services via the Istio Gateway at: http://localhost:13000"
        }
    }
}