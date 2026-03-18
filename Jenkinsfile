pipeline {
    agent any

    environment {
        IMAGE_NAME   = 'demo-frontend'
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        REGISTRY     = credentials('docker-registry-url')   // set in Jenkins credentials
        DOCKER_CREDS = credentials('docker-registry-creds') // username/password binding
        VITE_API_URL = credentials('vite-api-url')          // backend API base URL
    }

    tools {
        nodejs 'Node-20'  // configured in Jenkins → Global Tool Configuration
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.BRANCH_NAME} | Build: ${env.BUILD_NUMBER}"
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('demo-frontend') {
                    sh 'npm ci --prefer-offline'
                }
            }
        }

        stage('Build') {
            steps {
                dir('demo-frontend') {
                    sh "VITE_API_URL=${VITE_API_URL} npm run build"
                    archiveArtifacts artifacts: 'dist/**', fingerprint: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('demo-frontend') {
                    sh """
                        docker build \
                            -f Dockerfile \
                            --build-arg VITE_API_URL=${VITE_API_URL} \
                            -t ${IMAGE_NAME}:${IMAGE_TAG} \
                            -t ${IMAGE_NAME}:latest \
                            .
                    """
                }
            }
        }

        stage('Docker Push') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                sh """
                    echo ${DOCKER_CREDS_PSW} | docker login ${REGISTRY} -u ${DOCKER_CREDS_USR} --password-stdin
                    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker tag ${IMAGE_NAME}:latest     ${REGISTRY}/${IMAGE_NAME}:latest
                    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                    docker push ${REGISTRY}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                echo "Deploying ${IMAGE_NAME}:${IMAGE_TAG} ..."
                // Option A – docker-compose (single server)
                sh """
                    docker-compose -f docker-compose.yml up -d --no-deps frontend
                """
                // Option B – kubectl (uncomment for Kubernetes)
                // sh """
                //     kubectl set image deployment/frontend frontend=${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                //     kubectl rollout status deployment/frontend
                // """
            }
        }
    }

    post {
        success {
            echo "Frontend pipeline SUCCESS — image: ${IMAGE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "Frontend pipeline FAILED on branch ${env.BRANCH_NAME}"
        }
        always {
            sh 'docker image prune -f --filter "until=24h"'
            cleanWs()
        }
    }
}
