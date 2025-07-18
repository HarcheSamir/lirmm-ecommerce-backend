// The new, modern Jenkinsfile for Kubernetes agents

pipeline {
    // This agent block is the core of the new setup.
    // It tells Jenkins to spin up a Pod in Kubernetes to run the build.
    agent {
        kubernetes {
            // This 'cloud' name must match what you configure in the Jenkins UI in the next step
            cloud 'kubernetes'
            label "build-pod-${UUID.randomUUID().toString()}"
            // This YAML defines the agent pod with all the tools we need
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jnlp # This container is required by Jenkins for communication
    image: jenkins/inbound-agent:latest
    args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']
    resources:
      limits:
        memory: "1024Mi"
        cpu: "1000m"
      requests:
        memory: "512Mi"
        cpu: "500m"
  - name: docker # A separate container with Docker tools
    image: docker:24-cli
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1024Mi"
        cpu: "1000m"
      requests:
        memory: "512Mi"
        cpu: "500m"
  - name: tools # A container with kubectl, kind, git, envsubst
    image: cachengo/kubectl-kind:v1.28.2
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "1024Mi"
        cpu: "1000m"
      requests:
        memory: "512Mi"
        cpu: "500m"
  # This volume allows all containers in the pod to share the workspace
  volumes:
    - name: workspace-volume
      emptyDir: {}
"""
        }
    }

    environment {
        // You MUST change this to your GitHub username
        GHCR_PREFIX = 'ghcr.io/HarcheSamir'
        // This is the ID of the GitHub PAT you will store in Jenkins
        GHCR_CREDENTIALS_ID = 'github-pat'
        IMAGE_TAG = "build-${env.BUILD_NUMBER}"
        KUBERNETES_MANIFEST_TEMPLATE_FILE = './kind-deployment/kubernetes-manifests.yaml'
        KUBERNETES_MANIFEST_RENDERED_FILE = "./kind-deployment/kubernetes-manifests-rendered-${env.BUILD_ID}.yaml"
    }

    stages {
        stage('Checkout') {
            steps {
                // This 'jnlp' container has git installed by default
                container('jnlp') {
                    cleanWs()
                    checkout scm
                }
            }
        }

        stage('Build and Push Custom Images') {
            steps {
                // Now we run Docker commands in the 'docker' container
                container('docker') {
                    withCredentials([string(credentialsId: GHCR_CREDENTIALS_ID, variable: 'GITHUB_TOKEN')]) {
                        // Log in to the GitHub Container Registry
                        sh "echo \$GITHUB_TOKEN | docker login ghcr.io -u HarcheSamir --password-stdin"

                        // Loop through your services and build/push them
                        script {
                            def services = ['api-gateway', 'auth-service', 'product-service', 'image-service', 'search-service', 'cart-service', 'order-service', 'review-service']
                            services.each { service ->
                                def imageName = "${env.GHCR_PREFIX}/${service}:${env.IMAGE_TAG}"
                                echo "Building and pushing ${imageName}"
                                sh "docker build -t ${imageName} ./${service}"
                                sh "docker push ${imageName}"
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy Application to Cluster') {
            steps {
                // Now we run kubectl commands in the 'tools' container
                container('tools') {
                    echo "Rendering and applying Kubernetes manifests..."
                    // We need to set the IMAGE_TAG for envsubst to use
                    sh "export IMAGE_TAG='${env.IMAGE_TAG}' && envsubst < ${KUBERNETES_MANIFEST_TEMPLATE_FILE} > ${KUBERNETES_MANIFEST_RENDERED_FILE}"
                    sh "kubectl apply -f ${KUBERNETES_MANIFEST_RENDERED_FILE}"

                    echo "Waiting for deployments to rollout..."
                    // This is a simplified wait, your original looping method is more robust
                    sh "kubectl rollout status deployment/api-gateway-deployment --timeout=5m"
                    // ... you would add waits for your other deployments here ...
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}