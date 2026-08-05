pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'school-erp-web-app'
        REGISTRY = 'my-registry:5000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Frontend Asset Validation') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                sh "docker push ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose up -d --no-deps --build web-app"
            }
        }
    }
}
