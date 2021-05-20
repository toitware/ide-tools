import cp = require('child_process');
import { workspace as Workspace, commands as Commands, window as Window, ExtensionContext, OutputChannel } from "vscode";

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


export function createRunCommand(toit_output: OutputChannel) {
  return () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');
    let editor = Window.activeTextEditor;
    if (!editor) return Window.showErrorMessage('No active file.');

    let file_path = editor.document.fileName;
    if (!file_path.endsWith('.toit')) return Window.showErrorMessage(`Unable to run ${file_path}`);

    list_devices(toit_pwd)
    .then(device_names => Window.showQuickPick(device_names))
    .then(device_name => {
      if (!device_name) return Window.showErrorMessage('Pick device to run app.');
      let command_process = cp.spawn('toit',['dev','-d', device_name, 'run',file_path]);
      toit_output.show();
      command_process.stdout.on('data', data => toit_output.append(`${data}`));
      command_process.stderr.on('data', data => toit_output.append(`${data}`));
    });
  };
}
