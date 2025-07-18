// Jenkinsfile - Final Version
pipeline {
    // Agent Configuration: The pipeline will run inside our custom agent.
    agent {
        docker {
            image 'my-jenkins-agent'
            // Run as root and mount the Docker socket to control Docker and Kind.
            args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    // Environment Variables: Centralized configuration for the entire pipeline.
    environment {
        CLUSTER_NAME = 'lirmm-k8s-cluster'
        // Use a dynamic and unique image tag for every build to ensure freshness.
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        // A consistent prefix for your application's Docker images.
        IMAGE_PREFIX = 'lirmm-ecommerce'
        K8S_MANIFEST_TEMPLATE = 'kind-deployment/kubernetes-manifests.yaml'
        K8S_MANIFEST_RENDERED = 'kind-deployment/kubernetes-manifests-rendered.yaml'
        KIND_CONFIG = 'kind-deployment/kind-cluster-config.yaml'
    }

    // Pipeline Stages: The sequence of operations.
    stages {

        stage('Cleanup Environment') {
            steps {
                script {
                    echo "--- Ensuring a clean slate by deleting any old Kind cluster: ${CLUSTER_NAME} ---"
                    // Use '|| true' to prevent the pipeline from failing if the cluster doesn't exist.
                    sh "kind delete cluster --name ${CLUSTER_NAME} || true"
                }
            }
        }

        stage('Build Service Images') {
            steps {
                script {
                    echo "--- Building all microservice Docker images with tag: ${IMAGE_TAG} ---"
                    // Find all subdirectories that contain a Dockerfile.
                    def serviceDirs = findFiles(glob: '**/Dockerfile').collect { it.path.split('/')[0] }.unique()

                    def builds = [:]
                    for (dir in serviceDirs) {
                        // Exclude the root directory itself.
                        if (dir != '.' && dir != '..') {
                            def serviceName = dir
                            def fullImageName = "${IMAGE_PREFIX}/${serviceName}:${IMAGE_TAG}"
                            def contextPath = "./${serviceName}"

                            builds[serviceName] = {
                                stage("Build ${serviceName}") {
                                    echo "Building Docker image: ${fullImageName}"
                                    try {
                                        sh "docker build -t ${fullImageName} ${contextPath}"
                                    } catch (e) {
                                        error "FATAL: Docker build failed for ${serviceName}. Aborting pipeline."
                                    }
                                }
                            }
                        }
                    }
                    // Execute all builds in parallel for speed.
                    parallel builds
                }
            }
        }

        stage('Create Kind Cluster') {
            steps {
                script {
                    echo "--- Provisioning local Kubernetes cluster: ${CLUSTER_NAME} ---"
                    sh "kind create cluster --name ${CLUSTER_NAME} --config ${KIND_CONFIG}"
                }
            }
        }

        stage('Load Images into Kind') {
            steps {
                script {
                    echo "--- Loading all required Docker images into the Kind cluster ---"
                    // List of all public images your Kubernetes manifest depends on.
                    def publicImages = [
                        "confluentinc/cp-zookeeper:7.3.2", "confluentinc/cp-kafka:7.3.2",
                        "docker.elastic.co/elasticsearch/elasticsearch:8.11.1",
                        "hashicorp/consul:1.18", "redis:7.2-alpine", "postgres:15-alpine"
                    ]

                    // First, load the custom images we just built.
                    def serviceDirs = findFiles(glob: '**/Dockerfile').collect { it.path.split('/')[0] }.unique()
                    for (dir in serviceDirs) {
                         if (dir != '.' && dir != '..') {
                            def serviceName = dir
                            def fullImageName = "${IMAGE_PREFIX}/${serviceName}:${IMAGE_TAG}"
                            echo "Loading custom image into kind: ${fullImageName}"
                            sh "kind load docker-image ${fullImageName} --name ${CLUSTER_NAME}"
                        }
                    }

                    // Second, pull and load the public images.
                    for (image in publicImages) {
                        echo "Loading public image into kind: ${image}"
                        sh "docker pull ${image}"
                        sh "kind load docker-image ${image} --name ${CLUSTER_NAME}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo "--- Deploying application stack to Kubernetes ---"
                    // Correctly export variables so 'envsubst' can replace them in the manifest.
                    // This is the most reliable way to handle the variable substitution.
                    sh "export IMAGE_PREFIX=${IMAGE_PREFIX} IMAGE_TAG=${IMAGE_TAG} && envsubst < ${K8S_MANIFEST_TEMPLATE} > ${K8S_MANIFEST_RENDERED}"
                    
                    echo "Applying rendered manifest: ${K8S_MANIFEST_RENDERED}"
                    sh "kubectl apply -f ${K8S_MANIFEST_RENDERED}"

                    echo "--- Deployment initiated. Allowing time for pods to stabilize... ---"
                    sh "sleep 60" // Wait for deployments to roll out before checking status.
                }
            }
        }
    }
    // Post-build Actions: These actions run after all stages, regardless of outcome.
    post {
        always {
            script {
                echo "--- PIPELINE FINISHED ---"
                echo "Final Pod Status:"
                sh "kubectl get pods -A"
                echo "-------------------------"
                echo "Application Access Points:"
                echo "- API Gateway:   http://localhost:13000"
                echo "- Consul UI:     http://localhost:18500"
                echo "- Elasticsearch: http://localhost:19200"
                echo "-------------------------"
                echo "To delete the cluster, run: kind delete cluster --name ${CLUSTER_NAME}"
            }
        }
    }
}