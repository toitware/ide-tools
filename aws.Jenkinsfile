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
              sh "npm version ${NIGHTLY_VERSION} --allow-same-version"
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
                sh "FILEEXT=vsix toitarchive toit-${NIGHTLY_VERSION}.vsix toit-archive toit-vscode $BUILD_VERSION"
              }
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
                sh "yarn run vsce publish --baseImagesUrl https://github.com/toitware/ide-tools/raw/master/vscode/ -p $AZURE_TOKEN $BUILD_VERSION"
              }

              withCredentials([string(credentialsId: 'leon-open-vsx-access-token', variable: 'OPEN_VSX_TOKEN')]) {
                sh "yarn run ovsx publish --baseImagesUrl https://github.com/toitware/ide-tools/raw/master/vscode/ -p $OPEN_VSX_TOKEN toit-$BUILD_VERSION.vsix"
              }
            }
          }
        }
      }
    }
  }
}
