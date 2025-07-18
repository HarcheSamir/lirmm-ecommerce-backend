// Jenkinsfile
pipeline {
    // 1. Agent Configuration: Use our custom-built agent.
    agent {
        docker {
            image 'my-jenkins-agent'
            // Run as root and mount the Docker socket to allow Docker-in-Docker.
            args '-u root -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    // 2. Environment Variables: Consistent configuration for the pipeline.
    environment {
        CLUSTER_NAME = 'lirmm-k8s-cluster'
        // Use the GitHub username/org and a build number for a unique image tag.
        IMAGE_PREFIX = 'your-dockerhub-username' // CHANGE THIS to your Docker Hub or GitHub username
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        // Paths to Kubernetes and Kind configuration files.
        K8S_MANIFEST_TEMPLATE = 'kind-deployment/kubernetes-manifests.yaml'
        K8S_MANIFEST_RENDERED = 'kind-deployment/kubernetes-manifests-rendered.yaml'
        KIND_CONFIG = 'kind-deployment/kind-cluster-config.yaml'
    }

    // 3. Pipeline Stages
    stages {

        stage('Cleanup Environment') {
            steps {
                script {
                    echo "--- Deleting existing Kind cluster to ensure a clean slate ---"
                    sh "kind delete cluster --name ${CLUSTER_NAME} || true"
                }
            }
        }

        stage('Build Service Images') {
            steps {
                script {
                    echo "--- Building all microservice Docker images ---"
                    def serviceDirs = findFiles(glob: '**/Dockerfile').collect { it.path.split('/')[0] }.unique()
                    def builds = [:]
                    for (dir in serviceDirs) {
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
                                        error "FATAL: Docker build failed for ${serviceName}."
                                    }
                                }
                            }
                        }
                    }
                    parallel builds
                }
            }
        }

        stage('Create Kind Cluster') {
            steps {
                script {
                    echo "--- Creating Kind Kubernetes cluster: ${CLUSTER_NAME} ---"
                    sh "kind create cluster --name ${CLUSTER_NAME} --config ${KIND_CONFIG}"
                }
            }
        }

        stage('Load Images into Kind') {
            steps {
                script {
                    echo "--- Loading all Docker images into the Kind cluster ---"
                    def publicImages = [
                        "confluentinc/cp-zookeeper:7.3.2", "confluentinc/cp-kafka:7.3.2",
                        "docker.elastic.co/elasticsearch/elasticsearch:8.11.1",
                        "hashicorp/consul:1.18", "redis:7.2-alpine", "postgres:15-alpine"
                    ]

                    // Load custom-built service images
                    def serviceDirs = findFiles(glob: '**/Dockerfile').collect { it.path.split('/')[0] }.unique()
                    for (dir in serviceDirs) {
                         if (dir != '.' && dir != '..') {
                            def serviceName = dir
                            def fullImageName = "${IMAGE_PREFIX}/${serviceName}:${IMAGE_TAG}"
                            echo "Loading custom image: ${fullImageName}"
                            sh "kind load docker-image ${fullImageName} --name ${CLUSTER_NAME}"
                        }
                    }

                    // Pull and load public images
                    for (image in publicImages) {
                        echo "Loading public image: ${image}"
                        sh "docker pull ${image}"
                        sh "kind load docker-image ${image} --name ${CLUSTER_NAME}"
                    }
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    echo "--- Deploying application to Kubernetes ---"
                    // Export variables so envsubst can use them to render the final manifest.
                    sh "export IMAGE_PREFIX=${IMAGE_PREFIX} IMAGE_TAG=${IMAGE_TAG} && envsubst < ${K8S_MANIFEST_TEMPLATE} > ${K8S_MANIFEST_RENDERED}"
                    echo "Applying manifest: ${K8S_MANIFEST_RENDERED}"
                    sh "kubectl apply -f ${K8S_MANIFEST_RENDERED}"
                    echo "--- Deployment initiated. Allow several minutes for all services to stabilize. ---"
                    sh "sleep 60"
                }
            }
        }
    }
    // 4. Post-build Actions
    post {
        always {
            script {
                echo "--- Pipeline Finished. Final Pod Status ---"
                sh "kubectl get pods -A"
                echo "-------------------------------------------"
                echo "Application Access Points:"
                echo "- API Gateway:   http://localhost:13000"
                echo "- Consul UI:     http://localhost:18500"
            }
        }
    }
}