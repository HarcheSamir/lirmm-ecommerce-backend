// Jenkinsfile (Fixed Kind Cluster Name, Cluster Remains After Build)

// Define lists as top-level Groovy variables BEFORE the pipeline block
def CUSTOM_SERVICES = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service']
def PUBLIC_IMAGES = [
    'postgres:15-alpine',
    'confluentinc/cp-zookeeper:7.3.2',
    'confluentinc/cp-kafka:7.3.2',
    'docker.elastic.co/elasticsearch/elasticsearch:8.11.1',
    'hashicorp/consul:1.18'
]
def DEPLOYMENT_NAMES = [
    'zookeeper-deployment', 'kafka-deployment', 'elasticsearch-deployment',
    'consul-deployment', 'auth-db-deployment', 'product-db-deployment',
    'api-gateway-deployment', 'auth-service-deployment', 'product-service-deployment',
    'image-service-deployment', 'search-service-deployment'
]


// Now start the pipeline block
pipeline {
    // Run on WSL agent
    agent { label 'wsl' }

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
    }

    environment {
        // --- Configuration ---
        IMAGE_PREFIX = 'library'
        IMAGE_TAG = "${env.BUILD_ID}"
        // *** CHANGED: Use a fixed, predictable name for the Kind cluster ***
        KIND_CLUSTER_NAME = "lirmm-ecommerce-dev-jenkins" // Or any fixed name you prefer
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
                        sh "docker build -t ${imageName} ./${serviceDir}"
                        echo "Finished building ${imageName}."
                    }
                }
            }
        }

        stage('Setup Kind Cluster') {
            steps {
                script {
                    // This step now ensures any cluster with the *fixed name* is removed first
                    echo "Checking for and cleaning up existing Kind cluster: ${env.KIND_CLUSTER_NAME}"
                    sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"

                    echo "Creating Kind cluster: ${env.KIND_CLUSTER_NAME} using ${env.KIND_CONFIG_FILE}"
                    // kind create uses the fixed name now and updates default kubeconfig
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

        stage('Deploy Application to Kind') {
             steps {
                 // Uses default context modified by 'kind create'
                script {
                    echo "Ensuring kubectl context is set..."
                    sh "kubectl config use-context kind-${env.KIND_CLUSTER_NAME}"
                    echo "Verifying kubectl connection to cluster..."
                    sh "kubectl cluster-info"
                    sh "kubectl get nodes"

                    echo "Rendering Kubernetes manifest with image details..."
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Applying rendered Kubernetes manifests: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Waiting for deployments to rollout..."
                    timeout(time: 15, unit: 'MINUTES') {
                        DEPLOYMENT_NAMES.each { deploymentName ->
                           echo "Waiting for deployment/${deploymentName} rollout status..."
                           sh "kubectl rollout status deployment/${deploymentName} --watch=true --timeout=10m"
                        }
                    }
                    echo "All specified deployments successfully rolled out."

                    sleep(time: 15, unit: 'SECONDS')
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

        stage('Integration/E2E Tests') {
             steps {
                echo "Running tests against deployed services on Kind..."
                echo "API Gateway access via NodePort: http://localhost:13000" // Still relies on the port mapping
                sleep(time: 10, unit: 'SECONDS') // Placeholder
             }
        }

    } // End stages

    post {
        always {
            script {
                 echo "Starting post-build cleanup..."
                 echo "Removing rendered manifest file: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                 sh "rm -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE} || true"

                 // --- CHANGED: DO NOT DELETE CLUSTER HERE ---
                 echo "Kind cluster ${env.KIND_CLUSTER_NAME} left running."
                 // echo "Deleting Kind cluster: ${env.KIND_CLUSTER_NAME}" // Commented out
                 // sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true" // Commented out

                 echo "Cleanup finished (Manifests removed, Cluster PERSISTS)."
             }
        }
        success {
            echo "Pipeline successful. Application deployed to Kind cluster: ${env.KIND_CLUSTER_NAME}"
        }
        failure {
            echo "Pipeline failed."
        }
    } // End post

} // End pipeline