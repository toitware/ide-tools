import cp = require('child_process');
import { workspace as Workspace, window as Window, OutputChannel, InputBoxOptions } from "vscode";

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

function login(toit_pwd: string, user: string, password: string): Promise<void> {
  let auth_login_cmd = `${toit_pwd} auth login -u ${user} -p ${password}`
  return new Promise((resolve, reject) =>
    cp.exec(auth_login_cmd, (error, _stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      resolve();
    }));
}

function auth_info(toit_pwd: string): Promise<AuthInfo> {
  let auth_info_cmd = `${toit_pwd} auth info -s -o json`
  return new Promise((resolve, reject) => {
    cp.exec(auth_info_cmd, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      let auth_info: AuthInfo = JSON.parse(stdout);
      resolve(auth_info);
    });
  });
}

interface AuthInfo {
  email?: string;
  id?: string;
  name?: string;
  organization_id?: string;
  organization_name?: string;
  status: string;
}

async function ensure_auth(toit_pwd: string): Promise<void> {
  let info = await auth_info(toit_pwd);
  if (info.status == 'authenticated') return;

  let user_prompt_options: InputBoxOptions = {
    prompt: 'Enter your e-mail for toit.io',
  };
  let user = await Window.showInputBox(user_prompt_options);
  if (!user) return new Promise((_resolve, reject) => reject('No e-mail provided'));

  let password_prompt_options: InputBoxOptions = {
    prompt: `Enter your password for toit.io`,
    password: true
  };
  let password = await Window.showInputBox(password_prompt_options);
  if (!password) return new Promise((_resolve, reject) => reject('No password provided'));

  try {
    return await login(toit_pwd, user, password);
  } catch (reason) {
    return new Promise((_resolve, reject) => reject(reason));
  }
}

async function runCommand(toit_output: OutputChannel) {
  // The code you place here will be executed every time your command is executed
  // Display a message box to the user
  let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');
  let editor = Window.activeTextEditor;
  if (!editor) return Window.showErrorMessage('No active file.');

  let file_path = editor.document.fileName;
  if (!file_path.endsWith('.toit')) return Window.showErrorMessage(`Unable to run ${file_path}.`);
  try {
    await ensure_auth(toit_pwd);
  } catch (reason) {
    return Window.showErrorMessage(`Login failed: ${reason}.`);
  }

  try {
    let device_names = await list_devices(toit_pwd);
    let device_name = await Window.showQuickPick(device_names);
    if (!device_name) throw 'No device selected.'

    let command_process = cp.spawn('toit',['dev','-d', device_name, 'run', file_path]);
    toit_output.show();
    command_process.stdout.on('data', data => toit_output.append(`${data}`));
    command_process.stderr.on('data', data => toit_output.append(`${data}`));
  } catch (reason) {
    Window.showErrorMessage(`Run app failed: ${reason}`)
  }
}

export function createRunCommand(toit_output: OutputChannel) {
  return () => { runCommand(toit_output) };
}
