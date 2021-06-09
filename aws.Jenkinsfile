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
      AZURE_TOKEN = credentials('leon-azure-access-token')
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
              sh 'yarn compile-prod'
            }
          }
        }

        stage('build package') {
          steps {
            dir('vscode') {
              sh "npm version $NIGHTLY_VERSION"
              sh "yarn package"
            }
          }
          post {
            success {
              archiveArtifacts artifacts: "vscode/toit-${NIGHTLY_VERSION}.vsix"
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
              withCredentials([[$class: 'FileBinding', credentialsId: 'gcloud-service-auth', variable: 'GOOGLE_APPLICATION_CREDENTIALS']]) {
                sh 'gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS'
                sh 'gcloud config set project infrastructure-220307'
                sh "FILEEXT=vsix toitarchive toit-${BUILD_VERSION.minus('v')}.vsix toit-archive toit-vscode $BUILD_VERSION"
              }
            }
          }
        }

        stage("publish") {
          // when {
          //   anyOf {
          //     tag 'v*'
          //   }
          // }

          steps {
            dir('vscode') {
              sh "yarn run vsce publish ${NIGHTLY_VERSION} -p $AZURE_TOKEN"
            }
          }
        }
      }
    }
  }
}
