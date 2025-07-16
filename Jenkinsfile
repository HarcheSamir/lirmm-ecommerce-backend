// Jenkinsfile

def CUSTOM_SERVICES = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service', 'cart-service', 'order-service'] 
def PUBLIC_IMAGES = [
    'postgres:15-alpine',
    'confluentinc/cp-zookeeper:7.3.2',
    'confluentinc/cp-kafka:7.3.2',
    'docker.elastic.co/elasticsearch/elasticsearch:8.11.1',
    'hashicorp/consul:1.18',
    'redis:7.2-alpine' // <-- ADDED redis
]
def DEPLOYMENT_NAMES = [
    'zookeeper-deployment', 'kafka-deployment', 'elasticsearch-deployment',
    'consul-deployment', 'redis-deployment',
    'auth-db-deployment', 'product-db-deployment', 'order-db-deployment',
    'api-gateway-deployment', 'auth-service-deployment', 'product-service-deployment',
    'image-service-deployment', 'search-service-deployment', 'cart-service-deployment', 'order-service-deployment', 'review-service-deployment' 
]


pipeline {
    agent { label 'wsl' } // Ensure your Jenkins agent has this label

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 50, unit: 'MINUTES') // Increased timeout slightly
    }

    environment {
        IMAGE_PREFIX = 'library' // Default for local Docker, Docker Hub user/org for remote
        IMAGE_TAG = "${env.BUILD_ID}"
        KIND_CLUSTER_NAME = "lirmm-ecommerce-dev-jenkins"
        KIND_CONFIG_FILE = './kind-deployment/kind-cluster-config.yaml'
        KUBERNETES_MANIFEST_TEMPLATE_FILE = './kind-deployment/kubernetes-manifests.yaml'
        KUBERNETES_MANIFEST_RENDERED_FILE = "./kind-deployment/kubernetes-manifests-rendered-${env.BUILD_ID}.yaml"
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
                        // Ensure Dockerfile exists
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
                         sh "docker pull ${imageName} || true" // Allow failure if already present locally for some reason
                    }

                    echo "Loading required images into Kind cluster ${env.KIND_CLUSTER_NAME}..."
                    // Load custom images built in this pipeline
                    CUSTOM_SERVICES.each { serviceDir ->
                        def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                        echo "Loading custom image: ${imageName}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                    // Load public images (already pulled to host)
                    PUBLIC_IMAGES.each { imageName ->
                        echo "Loading public image: ${imageName}"
                         sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                    echo "Finished loading images into Kind."
                }
            }
        }

        stage('Deploy Application to Kind') {
             steps {
                script {
                    echo "Ensuring kubectl context is set for Kind cluster..."
                    sh "kubectl config use-context kind-${env.KIND_CLUSTER_NAME}"
                    echo "Verifying kubectl connection to cluster..."
                    sh "kubectl cluster-info"
                    sh "kubectl get nodes"

                    echo "Rendering Kubernetes manifest with image details..."
                    // Ensure IMAGE_PREFIX and IMAGE_TAG are exported for envsubst
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    echo "Rendered manifest saved to ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"


                    echo "Applying rendered Kubernetes manifests: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Waiting for deployments to rollout..."
                    timeout(time: 20, unit: 'MINUTES') { // Increased rollout timeout
                        DEPLOYMENT_NAMES.each { deploymentName ->
                           echo "Waiting for deployment/${deploymentName} rollout status..."
                           sh "kubectl rollout status deployment/${deploymentName} --watch=true --timeout=15m" // Individual timeout
                        }
                    }
                    echo "All specified deployments successfully rolled out."

                    // Add a small delay for services to fully initialize and register with Consul
                    sleep(time: 30, unit: 'SECONDS') // Increased delay
                    echo "Checking Consul service health (informational)..."
                     try {
                        sh """
                           kubectl exec -i deployment/consul-deployment -c consul -- curl -s <http://localhost:8500/v1/health/state/any> > consul_health.txt
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
                // Example: Check API Gateway access based on Kind NodePort
                echo "API Gateway NodePort: <http://localhost:13000>" // Port from kind-cluster-config.yaml hostPort
                sleep(time: 10, unit: 'SECONDS') // Placeholder for actual test execution
                // Example: curl <http://localhost:13000/health>
             }
        }
    }

    post {
        always {
            script {
                 echo "Starting post-build cleanup..."
                 echo "Removing rendered manifest file: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                 sh "rm -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE} || true"

                 // Cluster is intentionally left running as per original Jenkinsfile modification
                 echo "Kind cluster ${env.KIND_CLUSTER_NAME} left running for inspection."

                 echo "Cleanup finished (Manifests removed, Cluster PERSISTS)."
             }
        }
        success {
            echo "Pipeline successful. Application deployed to Kind cluster: ${env.KIND_CLUSTER_NAME}"
            echo "Access services via NodePorts defined in kind-cluster-config.yaml (e.g., API Gateway at <http://localhost:13000>)"
        }
        failure {
            echo "Pipeline failed."
            // Consider adding steps to collect logs from pods if pipeline fails
            // sh "kubectl logs deployment/api-gateway-deployment -c api-gateway --tail=100"
        }
    }
}
