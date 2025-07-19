pipeline {
    agent any

    environment {
        IMAGE_PREFIX                = 'lirmm-ecommerce'
        IMAGE_TAG                   = "build-${env.BUILD_NUMBER}"
        KIND_CLUSTER_NAME           = "lirmm-dev-cluster"
        KUBECONFIG_PATH             = "${pwd()}/kubeconfig.internal"
        KUBERNETES_RENDERED_FILE    = "${pwd()}/kind-deployment/kubernetes-manifests-rendered.yaml"
    }

    stages {
        stage('Create Cluster, Build & Load Images') {
            steps {
                script {
                    sh 'chmod +x ./kind-deployment/setup-kind.sh'
                    sh './kind-deployment/setup-kind.sh create_cluster'
                    sh './kind-deployment/setup-kind.sh build_images'
                    // This is the long-running step
                    sh './kind-deployment/setup-kind.sh load_images'
                }
            }
        }

        stage('Deploy Application to Kubernetes') {
            steps {
                script {
                    echo "--- Generating and correcting the internal kubeconfig ---"
                    sh """
                        kind get kubeconfig --name ${KIND_CLUSTER_NAME} --internal > ${KUBECONFIG_PATH}
                        KIND_IP=\$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "${KIND_CLUSTER_NAME}-control-plane")
                        sed -i "s|server: https://.*:6443|server: https://\${KIND_IP}:6443|g" ${KUBECONFIG_PATH}
                    """

                    echo "--- Rendering Kubernetes Manifest ---"
                    sh """
                        export IMAGE_PREFIX='${env.IMAGE_PREFIX}'
                        export IMAGE_TAG='${env.IMAGE_TAG}'
                        envsubst < ./kind-deployment/kubernetes-manifests.yaml > ${KUBERNETES_RENDERED_FILE}
                    """

                    echo "--- Deploying to Kubernetes using the proven connection method ---"
                    docker.image('alpine/k8s:1.27.3').inside("--network kind") {
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} cluster-info"
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} apply -f ${KUBERNETES_RENDERED_FILE}"
                        echo "--- Waiting for deployments to become available ---"
                        sh "kubectl --kubeconfig=${KUBECONFIG_PATH} wait --for=condition=Available --all deployments -n default --timeout=15m"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "--- Cleaning up temporary files and cluster ---"
            sh "rm -f ${KUBECONFIG_PATH} || true"
            sh "rm -f ${KUBERNETES_RENDERED_FILE} || true"
            sh "kind delete cluster --name ${KIND_CLUSTER_NAME} || true"
        }
        success {
            echo ""
            echo "##################################"
            echo "###     PIPELINE SUCCEEDED     ###"
            echo "##################################"
        }
        failure {
             echo ""
             echo "##################################"
             echo "###       PIPELINE FAILED      ###"
             echo "##################################"
        }
    }
}