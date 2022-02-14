pipeline {
  agent {
    kubernetes {
      defaultContainer 'idetools'
      yamlFile 'Jenkins.pod.yaml'
    }
  }

  environment {
      BUILD_VERSION = sh(returnStdout: true, script: 'gitversion').trim()
      NIGHTLY_VERSION = sh(returnStdout: true, script: './tools/nightlyversion').trim()
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
  }

  stages {
    stage('vscode') {
      stages {
        stage('install') {
          steps {
            dir('vscode') {
              sh 'npm install'
            }
          }
        }

        stage('lint') {
          steps {
            dir('vscode') {
              sh 'npm run lint'
            }
          }
        }

        stage("test") {
          steps {
            dir("vscode") {
                sh """
                  export DISPLAY=':99.0'
                  /usr/bin/Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
                  npm run ci-test
                  """
            }
          }
          post {
            always {
              dir("vscode") {
                junit "junit.xml"
              }
            }
          }
        }

        stage('compile') {
          steps {
            dir('vscode') {
              sh 'npm run compile-prod'
            }
          }
        }

        stage('build package') {
          steps {
            dir('vscode') {
              sh "npm version ${NIGHTLY_VERSION} --allow-same-version"
              sh "npm run package"
            }
          }
          post {
            success {
              archiveArtifacts artifacts: "vscode/toit-${NIGHTLY_VERSION}.vsix"
            }
          }
        }

        stage("publish") {
          when {
            anyOf {
              tag 'v*'
            }
          }

          steps {
            dir('vscode') {
              withCredentials([string(credentialsId: 'leon-azure-access-token', variable: 'AZURE_TOKEN')]) {
                sh 'npm run vsce-publish'
              }

              withCredentials([string(credentialsId: 'leon-open-vsx-access-token', variable: 'OPEN_VSX_TOKEN')]) {
                sh 'npm run ovsx-publish'
              }
            }
          }
        }
      }
    }
  }
}
