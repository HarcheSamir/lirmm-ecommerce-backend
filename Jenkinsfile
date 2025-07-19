pipeline {
    // THIS IS THE FIX: All commands will execute directly on your WSL host.
    agent { label 'wsl' }

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = "build-${env.BUILD_NUMBER}"
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        KIND_CONFIG_FILE            = './kind-deployment/kind-cluster-config.yaml'
        KUBERNETES_MANIFEST_FILE    = './kind-deployment/kubernetes-manifests.yaml'
        KUBERNETES_RENDERED_FILE    = "./kind-deployment/kubernetes-manifests-rendered.yaml"
    }

    stages {
        stage('Pull Base Images & Build Custom Images') {
            steps {
                script {
                    def publicImages = ['postgres:15-alpine', 'confluentinc/cp-zookeeper:7.3.2', 'confluentinc/cp-kafka:7.3.2', 'docker.elastic.co/elasticsearch/elasticsearch:8.11.1', 'hashicorp/consul:1.18', 'redis:7.2-alpine']
                    
                    echo "--- Pulling public images ---"
                    publicImages.each { image ->
                        sh "docker pull ${image}"
                    }

                    echo "--- Building custom service images ---"
                    def services = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service', 'cart-service', 'order-service', 'review-service']
                    services.each { service ->
                        def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
                        echo "Building ${imageName}"
                        sh "docker build -t ${imageName} ./${service}"
                    }
                }
            }
        }

        stage('Create Cluster, Load Images & Deploy') {
            steps {
                script {
                    echo "--- Creating Kind cluster (ports will now be mapped) ---"
                    sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"
                    sh "kind create cluster --name ${env.KIND_CLUSTER_NAME} --config ${env.KIND_CONFIG_FILE}"

                    echo "--- Loading images into Kind (this will take a while) ---"
                    def allImages = []
                    def services = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service', 'cart-service', 'order-service', 'review-service']
                    services.each { service -> allImages.add("${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}") }
                    allImages.addAll(['postgres:15-alpine', 'confluentinc/cp-zookeeper:7.3.2', 'confluentinc/cp-kafka:7.3.2', 'docker.elastic.co/elasticsearch/elasticsearch:8.11.1', 'hashicorp/consul:1.18', 'redis:7.2-alpine'])
                    
                    // Loading one by one for stability
                    allImages.each { image ->
                        echo "Loading: ${image}"
                        sh "kind load docker-image ${image} --name ${env.KIND_CLUSTER_NAME}"
                    }

                    echo "--- Deploying application to Kind cluster ---"
                    sh "kubectl cluster-info"
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_FILE} > ${env.KUBERNETES_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.KUBERNETES_RENDERED_FILE}"

                    echo "--- Waiting for deployments to become available ---"
                    sh "kubectl wait --for=condition=Available --all deployments -n default --timeout=15m"
                }
            }
        }
    }

    post {
        always {
            sh "rm -f ${env.KUBERNETES_RENDERED_FILE} || true"
            // We leave the cluster running so you can access it.
            echo "Kind cluster '${env.KIND_CLUSTER_NAME}' is running."
        }
        success {
            echo "--- PIPELINE SUCCEEDED ---"
            echo "Access API Gateway at: http://localhost:13000"
            echo "Access Consul UI at: http://localhost:18500"
        }
    }
}