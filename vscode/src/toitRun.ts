import cp = require('child_process');
import { workspace as Workspace, commands as Commands, window as Window, ExtensionContext, OutputChannel, InputBoxOptions } from "vscode";

function list_devices(toit_pwd: string): Promise<string[]> {
  let list_devices_cmd = toit_pwd + ' devices --active --names -o short';
  return new Promise((resolve, reject) => {
    cp.exec(list_devices_cmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        let device_names = stdout.split('\n');
        resolve(device_names);
      }
    });
  });
}

function auth_info(toit_pwd: string): Promise<AuthInfo> {
  let auth_info_cmd = `${toit_pwd} auth info -s -o json`
  return new Promise((resolve, reject) => {
    cp.exec(auth_info_cmd, (error, stdout) => {
      if (error) {
        return reject();
      }
      resolve(Object.assign(new AuthInfo(), stdout));
    });
  });
}

class AuthInfo {
  email?: string;
  id?: string;
  name?: string;
  organization_id?: string;
  organization_name?: string;
  status: string = 'unauthenticated';
}

function ensure_auth(toit_pwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let info = auth_info(toit_pwd).then(info => {
      if (info.status == 'authenticated') return resolve();
    });

    let user_prompt_options: InputBoxOptions = {
      prompt: 'Enter your e-mail for toit.io',
    };
    let password_prompt_options: InputBoxOptions = {
      prompt: `Enter your password for toit.io`,
      password: true
    };
    let user: string
    let password: string
    Window.showInputBox(user_prompt_options)
    .then( (u?: string) => {
      if (!u) return reject();
      user = u
    })
    .then( () => Window.showInputBox(password_prompt_options))
    .then( (pw?: string) => {
      if (!pw) return reject();
      password = pw
    }).then( () => {
      let auth_login_cmd = `${toit_pwd} auth login -u ${user} -p ${password}`

      cp.exec(auth_login_cmd, (error, stdout, stderr) => {
        if (error) {
          reject(`Login failed: ${stderr}`);
        } else {
          resolve();
        }
      });
    });
  });
}

export function createRunCommand(toit_output: OutputChannel) {
  return () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');
    let editor = Window.activeTextEditor;
    if (!editor) return Window.showErrorMessage('No active file.');

    let file_path = editor.document.fileName;
    if (!file_path.endsWith('.toit')) return Window.showErrorMessage(`Unable to run ${file_path}`);

    ensure_auth(toit_pwd)
    .then(() => list_devices(toit_pwd))
    .then(device_names => Window.showQuickPick(device_names))
    .then(device_name => {
      if (!device_name) throw 'No device selected.'
      let command_process = cp.spawn('toit',['dev','-d', device_name, 'run',file_path]);
      toit_output.show();
      command_process.stdout.on('data', data => toit_output.append(`${data}`));
      command_process.stderr.on('data', data => toit_output.append(`${data}`));
    }).catch((reason) => {
      Window.showErrorMessage(`Failed to run app ${file_path}. ${reason}`);
    });
  };
}
