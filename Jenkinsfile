pipeline {
  agent { label 'wsl' }

  environment {
    IMAGE_PREFIX        = 'lirmm-ecommerce'
    IMAGE_TAG           = 'latest'
    KIND_CLUSTER_NAME   = "lirmm-dev-cluster"
    APP_NAMESPACE       = 'lirmm-services'
    APP_MANIFEST_FILE   = './kind-deployment/app-manifests.yaml'
  }

  stages {
    stage('Detect & Build Changed Services') {
      steps {
        script {
          echo "Detecting services with code changes..."
          def servicesToBuild = new HashSet<String>()
          def allServices = [
            'api-gateway', 'auth-service', 'product-service', 'image-service',
            'search-service', 'cart-service', 'order-service', 'review-service',
            'payment-service', 'stats-service'
          ]

          // Check if HEAD~1 exists; if not, build all
          def prevExists = sh(returnStatus: true, script: 'git rev-parse --verify HEAD~1 >/dev/null 2>&1') == 0
          if (!prevExists) {
            echo "No previous commit (initial commit). Building all services."
            servicesToBuild.addAll(allServices)
          } else {
            def changedFiles = sh(returnStdout: true, script: 'git diff --name-only HEAD~1 HEAD || true').trim()
            if (changedFiles) {
              changedFiles.split('\\n').each { filePath ->
                def parts = filePath.tokenize('/')
                if (parts.size() > 0) {
                  def serviceDir = parts[0]
                  if (allServices.contains(serviceDir)) {
                    servicesToBuild.add(serviceDir)
                  }
                }
              }
            } else {
              echo "No code changes detected between HEAD~1 and HEAD."
            }
          }

          if (!servicesToBuild.isEmpty()) {
            echo "Services to BUILD: ${servicesToBuild.join(', ')}"
            servicesToBuild.each { service ->
              echo "Building and loading image for ${service}..."
              def imageName = "${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}"
              sh "docker build -t ${imageName} ./${service}"
              sh "kind load docker-image ${imageName} --name ${env.KIND_CLUSTER_NAME}"
            }
          } else {
            echo "No services need building."
          }

        }
      }
    }

    stage('Deploy & Hot Refresh Application') {
      steps {
        script {
          echo "Applying application manifests (ensures resources exist)..."
          sh "kubectl apply -f ${env.APP_MANIFEST_FILE} -n ${env.APP_NAMESPACE}"
          sleep 10

          echo "Restarting application workloads to ensure initContainers/migrations/seeding run..."
          // Restart deployments and statefulsets labeled app-type=microservice
          sh "kubectl rollout restart deployment -n ${env.APP_NAMESPACE} -l app-type=microservice || true"
          sh "kubectl rollout restart statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice || true"

          echo "Waiting for deployments to be available..."
          sh "kubectl wait --for=condition=Available deployment -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m || true"

          echo "Waiting for statefulsets to finish rolling upgrade..."
          sh "kubectl rollout status statefulset -n ${env.APP_NAMESPACE} -l app-type=microservice --timeout=15m || true"
        }
      }
    }
  }

  post {
    success {
      echo "APPLICATION PIPELINE SUCCEEDED"
    }
    failure {
      echo "APPLICATION PIPELINE FAILED"
    }
  }
}
