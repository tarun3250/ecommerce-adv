pipeline {
    agent any

    environment {
        IMAGE_NAME = "tarun325/ecommerce-backend"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Checking out latest source from GitHub..."
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                echo "Building application with Maven and skipping tests..."
                sh 'chmod +x mvnw'
                sh './mvnw clean package -DskipTests'
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Docker images..."
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Login & Push') {
            steps {
                echo "Authenticating with Docker Hub securely..."
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    
                    echo "Pushing Docker images to registry..."
                    sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
                    sh "docker push ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Update Kubernetes Deployment') {
            steps {
                echo "Updating Kubernetes deployment with new image tag: ${BUILD_NUMBER}..."
                sh "kubectl set image deployment/ecommerce-backend ecommerce=${IMAGE_NAME}:${BUILD_NUMBER}"
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "Verifying rollout status..."
                sh "kubectl rollout status deployment/ecommerce-backend"
                
                echo "Displaying current Pods and Services..."
                sh "kubectl get pods"
                sh "kubectl get svc"
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline executed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Please check the logs."
        }
        always {
            echo "🧹 Cleaning up workspace..."
            cleanWs()
        }
    }
}
