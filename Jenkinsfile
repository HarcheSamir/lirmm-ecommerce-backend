// Jenkinsfile (Corrected - Fix kubectl connectivity from Jenkins container to Kind)

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
    // Agent needs docker, kubectl, kind, envsubst installed
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        timeout(time: 45, unit: 'MINUTES')
    }

    environment {
        // --- Configuration (Keep simple string assignments here) ---
        IMAGE_PREFIX = 'library' // Change if using a specific registry
        IMAGE_TAG = "${env.BUILD_ID}" // Use Jenkins Build ID
        KIND_CLUSTER_NAME = "jenkins-${env.JOB_NAME}-${env.BUILD_NUMBER}".replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()
        KIND_CONFIG_FILE = './kind-deployment/kind-cluster-config.yaml'
        KUBERNETES_MANIFEST_TEMPLATE_FILE = './kind-deployment/kubernetes-manifests.yaml'
        KUBERNETES_MANIFEST_RENDERED_FILE = "./kind-deployment/kubernetes-manifests-rendered-${env.BUILD_ID}.yaml"
        // Path for the temporary internal kubeconfig
        KIND_INTERNAL_KUBECONFIG = "${WORKSPACE}/kind-kubeconfig-${env.BUILD_ID}.yaml"
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

        stage('Setup Temporary Kind Cluster') {
            steps {
                script {
                    echo "Checking for and cleaning up old Kind cluster: ${env.KIND_CLUSTER_NAME}"
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

                    // *** ADDED: Get internal kubeconfig AFTER cluster creation ***
                    echo "Getting internal kubeconfig for Kind cluster ${env.KIND_CLUSTER_NAME}..."
                    sh "kind get kubeconfig --name ${env.KIND_CLUSTER_NAME} --internal > ${env.KIND_INTERNAL_KUBECONFIG}"
                    echo "Internal kubeconfig saved to ${env.KIND_INTERNAL_KUBECONFIG}"
                }
            }
        }

        stage('Deploy Application to Kind') {
             steps {
                script {
                    echo "Using Internal Kubeconfig: ${env.KIND_INTERNAL_KUBECONFIG}"

                    // *** ADDED: Verify kubectl can connect using the internal config ***
                    echo "Verifying kubectl connection..."
                    sh "kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} cluster-info"
                    sh "kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} get nodes"

                    echo "Rendering Kubernetes manifest with image details..."
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Applying rendered Kubernetes manifests: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    // *** MODIFIED: Pass internal kubeconfig to apply ***
                    sh "kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} apply -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Waiting for deployments to rollout..."
                    timeout(time: 15, unit: 'MINUTES') {
                        DEPLOYMENT_NAMES.each { deploymentName ->
                           echo "Waiting for deployment/${deploymentName} rollout status..."
                           // *** MODIFIED: Pass internal kubeconfig to rollout status ***
                           sh "kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} rollout status deployment/${deploymentName} --watch=true --timeout=10m"
                        }
                    }
                    echo "All specified deployments successfully rolled out."

                    sleep(time: 15, unit: 'SECONDS')
                    echo "Checking Consul service health (informational)..."
                     try {
                        // *** MODIFIED: Pass internal kubeconfig to exec ***
                        sh """
                           kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} exec -i deployment/consul-deployment -c consul -- sh -c 'apk add --no-cache curl &> /dev/null || true'
                           kubectl --kubeconfig ${env.KIND_INTERNAL_KUBECONFIG} exec -i deployment/consul-deployment -c consul -- curl -s http://localhost:8500/v1/health/state/any > consul_health.txt
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
                echo "API Gateway access via NodePort: http://localhost:13000"
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
                 // *** ADDED: Remove the temporary internal kubeconfig file ***
                 echo "Removing temporary Kind kubeconfig file: ${env.KIND_INTERNAL_KUBECONFIG}"
                 sh "rm -f ${env.KIND_INTERNAL_KUBECONFIG} || true"
                 echo "Deleting Kind cluster: ${env.KIND_CLUSTER_NAME}"
                 sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"
                 echo "Cleanup finished."
            }
        }
        success {
            echo "Pipeline successful. Application deployed and validated in Kind cluster: ${env.KIND_CLUSTER_NAME}"
        }
        failure {
            echo "Pipeline failed."
        }
    } // End post

} // End pipeline