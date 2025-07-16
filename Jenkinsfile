// Jenkinsfile

def CUSTOM_SERVICES = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service', 'cart-service', 'order-service', 'review-service'] 
def PUBLIC_IMAGES = [
    'postgres:15-alpine',
    'confluentinc/cp-zookeeper:7.3.2',
    'confluentinc/cp-kafka:7.3.2',
    'docker.elastic.co/elasticsearch/elasticsearch:8.11.1',
    'hashicorp/consul:1.18',
    'redis:7.2-alpine'
]
def DEPLOYMENT_NAMES = [
    'zookeeper-deployment', 'kafka-deployment', 'elasticsearch-deployment',
    'consul-deployment', 'redis-deployment',
    'auth-db-deployment', 'product-db-deployment', 'order-db-deployment', 'review-db-deployment',
    'api-gateway-deployment', 'auth-service-deployment', 'product-service-deployment',
    'image-service-deployment', 'search-service-deployment', 'cart-service-deployment', 'order-service-deployment', 'review-service-deployment' 
]

pipeline {
    agent { label 'wsl' } // Ensure your Jenkins agent has this label

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 60, unit: 'MINUTES') // Increased timeout for Istio setup
    }

    environment {
        IMAGE_PREFIX = 'library' // Default for local Docker, Docker Hub user/org for remote
        IMAGE_TAG = "${env.BUILD_ID}"
        KIND_CLUSTER_NAME = "lirmm-ecommerce-dev-jenkins"
        KIND_CONFIG_FILE = './kind-deployment/kind-cluster-config.yaml'
        KUBERNETES_MANIFEST_TEMPLATE_FILE = './kind-deployment/kubernetes-manifests.yaml'
        KUBERNETES_MANIFEST_RENDERED_FILE = "./kind-deployment/kubernetes-manifests-rendered-${env.BUILD_ID}.yaml"
        // <-- NEW: Istio Version -->
        ISTIO_VERSION = "1.22.1"
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                echo "Workspace cleaned."
                checkout scm
                echo "Code checked out from SCM."
                sh "test -f ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} || (echo 'ERROR: Manifest template file not found!' && exit 1)"
            }
        }

        stage('Build Custom Docker Images') {
            steps {
                script {
                    CUSTOM_SERVICES.each { serviceDir ->
                        def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                        echo "Building Docker image ${imageName} from ./${serviceDir}..."
                        sh "test -f ./${serviceDir}/Dockerfile || (echo 'ERROR: Dockerfile not found in ./${serviceDir}!' && exit 1)"
                        sh "docker build -t ${imageName} ./${serviceDir}"
                        echo "Finished building ${imageName}."
                    }
                }
            }
        }

        stage('Setup Kind Cluster') {
            steps {
                script {
                    echo "Checking for and cleaning up existing Kind cluster: ${env.KIND_CLUSTER_NAME}"
                    sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"

                    echo "Creating Kind cluster: ${env.KIND_CLUSTER_NAME} using ${env.KIND_CONFIG_FILE}"
                    sh "kind create cluster --name ${env.KIND_CLUSTER_NAME} --config ${env.KIND_CONFIG_FILE}"

                    echo "Pulling required public images to host cache..."
                    PUBLIC_IMAGES.each { imageName ->
                         sh "docker pull ${imageName} || true"
                    }

                    echo "Loading required images into Kind cluster ${env.KIND_CLUSTER_NAME}..."
                    CUSTOM_SERVICES.each { serviceDir ->
                        def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                        echo "Loading custom image: ${imageName}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                    PUBLIC_IMAGES.each { imageName ->
                        echo "Loading public image: ${imageName}"
                         sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                    echo "Finished loading images into Kind."
                }
            }
        }
        
        // <-- NEW STAGE: Install Istio & Addons -->
        stage('Install Istio & Addons') {
            steps {
                script {
                    echo "Ensuring kubectl context is set for Kind cluster..."
                    sh "kubectl config use-context kind-${env.KIND_CLUSTER_NAME}"
                    
                    echo "Downloading Istio CLI (istioctl) version ${env.ISTIO_VERSION}..."
                    sh "curl -L https://istio.io/downloadIstio | ISTIO_VERSION=${env.ISTIO_VERSION} sh -"
                    
                    def istioPath = "${pwd()}/istio-${env.ISTIO_VERSION}/bin"
                    
                    withEnv(["PATH+ISTIO=${istioPath}"]) {
                        echo "Installing Istio onto the cluster..."
                        sh "istioctl install --set profile=demo -y"

                        echo "Enabling Istio automatic sidecar injection on the 'default' namespace..."
                        sh "kubectl label namespace default istio-injection=enabled --overwrite"

                        echo "Deploying Istio's Prometheus, Grafana, and Kiali addons..."
                        sh "kubectl apply -f istio-${env.ISTIO_VERSION}/samples/addons/prometheus.yaml"
                        sh "kubectl apply -f istio-${env.ISTIO_VERSION}/samples/addons/grafana.yaml"
                        sh "kubectl apply -f istio-${env.ISTIO_VERSION}/samples/addons/kiali.yaml"
                    }
                }
            }
        }

        stage('Deploy Application to Kind') {
             steps {
                script {
                    echo "Ensuring kubectl context is set for Kind cluster..."
                    sh "kubectl config use-context kind-${env.KIND_CLUSTER_NAME}"

                    echo "Rendering Kubernetes manifest with image details..."
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    echo "Rendered manifest saved to ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Applying rendered Kubernetes manifests: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Waiting for all deployments to rollout..."
                    timeout(time: 25, unit: 'MINUTES') { // Increased total rollout timeout
                        // First, wait for Istio components to be ready
                        echo "Waiting for Istio Ingress Gateway..."
                        sh "kubectl rollout status deployment/istio-ingressgateway -n istio-system --watch=true --timeout=5m"

                        // Now, wait for our application deployments
                        DEPLOYMENT_NAMES.each { deploymentName ->
                           echo "Waiting for deployment/${deploymentName} rollout status..."
                           // Note: Istio-injected pods will take longer to become ready (2 containers)
                           sh "kubectl rollout status deployment/${deploymentName} --watch=true --timeout=15m"
                        }
                    }
                    echo "All specified deployments successfully rolled out."

                    // The Consul health check remains a good secondary validation
                    sleep(time: 30, unit: 'SECONDS')
                    echo "Checking Consul service health (informational)..."
                     try {
                        sh """
                           kubectl exec -i deployment/consul-deployment -c consul -- curl -s http://localhost:8500/v1/health/state/any > consul_health.txt
                           echo '--- Consul Health ---'
                           cat consul_health.txt
                           echo '---------------------'
                           if grep -q '"Status": ?"critical"' consul_health.txt; then
                              echo "WARNING: One or more services are critical in Consul."
                           else
                              echo "Consul health looks okay (no critical services found)."
                           fi
                           rm consul_health.txt
                        """
                     } catch (err) {
                         echo "WARNING: Could not verify Consul health check: ${err}"
                     }
                }
            }
        }

        stage('Integration/E2E Tests (Placeholder)') {
             steps {
                echo "Running tests against deployed services on Kind..."
                // <-- MODIFIED: The access point is now the Istio Gateway, which we map to hostPort 13000 -->
                echo "Application Entry Point (Istio Gateway): http://localhost:13000"
                sleep(time: 15, unit: 'SECONDS') // Placeholder for actual test execution
                echo "Pinging API Gateway health endpoint through Istio Gateway..."
                sh "curl -I http://localhost:13000/health"
             }
        }
    }

    post {
        always {
            script {
                 echo "Starting post-build cleanup..."
                 echo "Removing rendered manifest file: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                 sh "rm -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE} || true"

                 echo "Kind cluster ${env.KIND_CLUSTER_NAME} left running for inspection."
                 echo "Cleanup finished (Manifests removed, Cluster PERSISTS)."
             }
        }
        success {
            echo "Pipeline successful. Application deployed to Kind cluster: ${env.KIND_CLUSTER_NAME}"
            // <-- MODIFIED: Updated instructions for Istio environment -->
            echo "Access application via Istio Gateway at: http://localhost:13000"
            echo "To access observability dashboards, use 'kubectl port-forward' on the machine running Jenkins:"
            echo "Grafana: kubectl port-forward svc/grafana -n istio-system 3000:3000"
            echo "Kiali:   kubectl port-forward svc/kiali -n istio-system 20001:20001"
        }
        failure {
            echo "Pipeline failed."
            // You can add more detailed log collection here if needed
            // sh "kubectl get pods -A"
            // sh "kubectl logs deployment/api-gateway-deployment -c api-gateway --tail=100"
        }
    }
}