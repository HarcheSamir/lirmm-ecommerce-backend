// Jenkinsfile

pipeline {
    // Agent needs docker, kubectl, kind, envsubst installed
    // Assuming the agent is configured as per your Jenkins Dockerfile
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        // Increased timeout for cluster creation, image loading, and rollout waits
        timeout(time: 45, unit: 'MINUTES')
    }

    environment {
        // --- Configuration ---
        // Define how images are named. Use 'library/' for local/DockerHub anonymous builds.
        // Change IMAGE_PREFIX if pushing to a specific registry (e.g., 'your-dockerhub-user', 'your-registry.com/project')
        IMAGE_PREFIX = 'library'
        // Unique tag for this specific build
        IMAGE_TAG = "${env.BUILD_ID}"

        // Unique name for the temporary Kind cluster for this build
        KIND_CLUSTER_NAME = "jenkins-${env.JOB_NAME}-${env.BUILD_NUMBER}".replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()

        // Paths relative to the Jenkins workspace root
        KIND_CONFIG_FILE = './kind-deployment/kind-cluster-config.yaml'
        KUBERNETES_MANIFEST_TEMPLATE_FILE = './kind-deployment/kubernetes-manifests.yaml' // Template with ${VARS}
        KUBERNETES_MANIFEST_RENDERED_FILE = "./kind-deployment/kubernetes-manifests-rendered-${env.BUILD_ID}.yaml" // Temp file

        // List of your custom service directories for iteration
        CUSTOM_SERVICES = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service']

        // List of public images used in manifests (for pre-loading)
        PUBLIC_IMAGES = [
            'postgres:15-alpine',
            'confluentinc/cp-zookeeper:7.3.2',
            'confluentinc/cp-kafka:7.3.2',
            'docker.elastic.co/elasticsearch/elasticsearch:8.11.1',
            'hashicorp/consul:1.18'
        ]

        // Expected deployment names (must match names in kubernetes-manifests.yaml)
        DEPLOYMENT_NAMES = [
            'zookeeper-deployment', 'kafka-deployment', 'elasticsearch-deployment',
            'consul-deployment', 'auth-db-deployment', 'product-db-deployment',
            'api-gateway-deployment', 'auth-service-deployment', 'product-service-deployment',
            'image-service-deployment', 'search-service-deployment'
        ]
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                echo "Workspace cleaned."
                checkout scm
                echo "Code checked out from SCM."
                 // Verify manifest template exists
                sh "test -f ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} || (echo 'ERROR: Manifest template file not found!' && exit 1)"
            }
        }

        stage('Build Custom Docker Images') {
            steps {
                script {
                    // Ensure login if pushing to a private registry (uncomment and configure if needed)
                    // Example:
                    // withCredentials([usernamePassword(credentialsId: 'your-docker-registry-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    //    sh "echo $DOCKER_PASS | docker login ${env.IMAGE_PREFIX.split('/')[0]} -u $DOCKER_USER --password-stdin" // Adjust login server if needed
                    // }

                    env.CUSTOM_SERVICES.each { serviceDir ->
                        def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                        echo "Building Docker image ${imageName} from ./${serviceDir}..."
                        // Use --no-cache for debugging build issues if necessary
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
                    // Use || true to prevent failure if cluster doesn't exist
                    sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"

                    echo "Creating Kind cluster: ${env.KIND_CLUSTER_NAME} using ${env.KIND_CONFIG_FILE}"
                    sh "kind create cluster --name ${env.KIND_CLUSTER_NAME} --config ${env.KIND_CONFIG_FILE}"

                    echo "Pulling required public images to host cache..."
                    env.PUBLIC_IMAGES.each { imageName ->
                         // Use || true in case pull fails but image might still load from cache later
                         sh "docker pull ${imageName} || true"
                    }

                    echo "Loading required images into Kind cluster ${env.KIND_CLUSTER_NAME}..."
                    // Load custom images built in this pipeline
                    env.CUSTOM_SERVICES.each { serviceDir ->
                        def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                        echo "Loading custom image: ${imageName}"
                        sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
                    }
                     // Load public base images
                    env.PUBLIC_IMAGES.each { imageName ->
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
                    echo "Ensuring kubectl context is set to Kind cluster: ${env.KIND_CLUSTER_NAME}"
                    // Kind create usually sets the context, but double-checking is safe
                    sh "kubectl config use-context kind-${env.KIND_CLUSTER_NAME}"

                    echo "Rendering Kubernetes manifest with image details..."
                    // Use envsubst to replace ${IMAGE_PREFIX} and ${IMAGE_TAG} in the template
                    // Requires 'gettext-base' package on the agent for envsubst
                    sh "export IMAGE_PREFIX='${env.IMAGE_PREFIX}' && export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${env.KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Applying rendered Kubernetes manifests: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                    sh "kubectl apply -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"

                    // Wait for all deployments to complete their rollout successfully
                    echo "Waiting for deployments to rollout..."
                    timeout(time: 15, unit: 'MINUTES') { // Adjust timeout as needed
                        env.DEPLOYMENT_NAMES.each { deploymentName ->
                           echo "Waiting for deployment/${deploymentName} rollout status..."
                           // Add -n <namespace> if not using 'default' namespace
                           sh "kubectl rollout status deployment/${deploymentName} --watch=true --timeout=10m" // Timeout per deployment
                        }
                    }
                    echo "All specified deployments successfully rolled out."

                    // Short delay to allow services to register with Consul after becoming ready
                    sleep(time: 15, unit: 'SECONDS')
                    echo "Checking Consul service health (informational)..."
                    // This check is informational, doesn't fail the build. Needs kubectl exec + curl inside consul pod.
                     try {
                        sh """
                           kubectl exec -i deployment/consul-deployment -c consul -- sh -c 'apk add --no-cache curl && curl -s http://localhost:8500/v1/health/state/any' > consul_health.txt
                           echo '--- Consul Health ---'
                           cat consul_health.txt
                           echo '---------------------'
                           # Basic check: See if any service is critical
                           if grep -q '"Status": ?"critical"' consul_health.txt; then
                              echo "WARNING: One or more services are critical in Consul."
                              # currentBuild.result = 'UNSTABLE' # Optionally mark build as unstable
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

        // Placeholder stage for running tests against the deployed stack
        stage('Integration/E2E Tests') {
             steps {
                echo "Running tests against deployed services on Kind..."
                echo "API Gateway access via NodePort: http://localhost:13000" // Agent needs access to Kind node's mapped ports
                // Add your testing commands here, e.g.:
                // sh "npm run test:integration -- --baseUrl=http://localhost:13000"
                sleep(time: 10, unit: 'SECONDS') // Placeholder
             }
        }

    } // End stages

    post {
        // This block runs regardless of the pipeline's success or failure
        always {
            script {
                 echo "Starting post-build cleanup..."

                 // Gather logs from Kind cluster before deleting (optional, helpful for failures)
                 // sh "kind export logs \"${WORKSPACE}/kind-logs-${env.BUILD_ID}\" --name ${env.KIND_CLUSTER_NAME}"
                 // archiveArtifacts artifacts: "kind-logs-${env.BUILD_ID}/**", fingerprint: true

                 // Remove the temporary rendered manifest file
                 echo "Removing rendered manifest file: ${env.KUBERNETES_MANIFEST_RENDERED_FILE}"
                 sh "rm -f ${env.KUBERNETES_MANIFEST_RENDERED_FILE} || true"

                 // Delete the temporary Kind cluster
                 echo "Deleting Kind cluster: ${env.KIND_CLUSTER_NAME}"
                 sh "kind delete cluster --name ${env.KIND_CLUSTER_NAME} || true"

                 // Optional: Remove locally built Docker images if space is a concern
                 // echo "Attempting to remove locally built Docker images with tag: ${env.IMAGE_TAG}"
                 // env.CUSTOM_SERVICES.each { serviceDir ->
                 //     def imageName = "${env.IMAGE_PREFIX}/${serviceDir}:${env.IMAGE_TAG}"
                 //     sh "docker rmi ${imageName} || true"
                 // }

                 echo "Cleanup finished."
             }
        }
        success {
            echo "Pipeline successful. Application deployed and validated in Kind cluster: ${env.KIND_CLUSTER_NAME}"
            // Add notifications (Slack, Email, etc.) here if desired
        }
        failure {
            echo "Pipeline failed."
            // Add notifications here
        }
        // aborted / unstable etc. can be added too
    } // End post

} // End pipeline