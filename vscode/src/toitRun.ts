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

function check_auth(toit_pwd: string): Promise<boolean> {
  let auth_info_cmd = `${toit_pwd} auth info -o short`
  return new Promise((resolve) => {
    cp.exec(auth_info_cmd, (error, stdout) => {
      if (error) {
        return resolve(false);
      }
      resolve (stdout == 'authenticated');
    });
  });
}


function ensure_auth(toit_pwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (check_auth(toit_pwd)) return resolve();

    let user_prompt_options: InputBoxOptions = {
      prompt: 'Enter your e-mail for toit.io',
    };
    let user = Window.showInputBox(user_prompt_options);
    if (!user) return reject();

    let password_prompt_options: InputBoxOptions = {
      prompt: `Enter your password for ${user}`,
      password: true
    };
    let password = Window.showInputBox(password_prompt_options);
    if (!password) return reject();

    let auth_login_cmd = `${toit_pwd} auth login -u ${user}`

    cp.exec(auth_login_cmd, (error) => {
      if (error) {
        reject("Login failed.");
      } else {
        resolve();
      }
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
