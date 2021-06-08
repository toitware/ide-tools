pipeline {
  agent {
    kubernetes {
      defaultContainer 'idetools'
      yamlFile 'Jenkins.pod.yaml'
    }
  }

  environment {
      BUILD_VERSION = sh(returnStdout: true, script: 'gitversion').trim()
      // AZURE_TOKEN = credentials('leon-azure-access-token')
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
              sh 'yarn install'
            }
          }
        }

        stage('lint') {
          steps {
            dir('vscode') {
              sh 'yarn lint'
            }
          }
        }

        // stage("test") {
        //     dir("vscode") {
        //       steps {
        //           sh "yarn test"
        //       }
        //       post {
        //           always {
        //               junit "junit.xml"
        //           }
        //       }
        //     }
        // }

        stage('compile') {
          steps {
            dir('vscode') {
              sh 'yarn compile'
            }
          }
        }

        stage('build package') {
          steps {
            dir('vscode') {
              sh 'yarn package'
            }
          }
          post {
            success {
              archiveArtifacts artifacts: 'vscode/toit-*.vsix'
            }
          }
        }

        stage('upload') {
          when {
            anyOf {
              branch 'master'
              branch pattern: "release-v\\d+.\\d+", comparator: 'REGEXP'
              tag 'v*'
            }
          }

          steps {
            dir('vscode') {
              sh "mv toit-*.vsix toit-${BUILD_VERSION}.vsix"
              withCredentials([[$class: 'FileBinding', credentialsId: 'gcloud-service-auth', variable: 'GOOGLE_APPLICATION_CREDENTIALS']]) {
                sh 'gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS'
                sh 'gcloud config set project infrastructure-220307'
                sh "FILEEXT=vsix toitarchive toit-${BUILD_VERSION}.vsix toit-archive toit-vscode ${BUILD_VERSION}"
              }
            }
          }
        }
      }
    }
  }
}
