pipeline {
    agent any
    stages {
        stage('Test Public Image Loading') {
            steps {
                sh 'chmod +x ./kind-deployment/setup-kind.sh'
                sh './kind-deployment/setup-kind.sh'
            }
        }
    }
    post {
        always {
            sh 'kind delete cluster --name lirmm-dev-cluster || true'
        }
    }
}