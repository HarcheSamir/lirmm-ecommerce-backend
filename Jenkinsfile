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

