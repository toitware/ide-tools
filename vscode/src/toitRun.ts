import cp = require('child_process');
import { workspace as Workspace, commands as Commands, window as Window, ExtensionContext } from "vscode";

export const runCommand = () => {
  // The code you place here will be executed every time your command is executed
  // Display a message box to the user
  let toit_pwd : string = Workspace.getConfiguration('toit').get('Path','toit');

  // TODO Get Current window pwd
  let editor = Window.activeTextEditor;
  if (editor === undefined) {
    Window.showWarningMessage('No active file.');
    return;
  }
  let file_path = editor.document.fileName;

  let toit_output = Window.createOutputChannel("Toit");
  toit_output.show();
  // TODO prompt for dev?
  let command_process = cp.spawn('toit',['dev','run',file_path]);
  command_process.stdout.on('data', (data) => {
    toit_output.append(`${data}`);
  });
  command_process.stdout.on('message', (data) => {
    toit_output.append(`${data}`);
  });
  command_process.stderr.on('data', (data) => {
    toit_output.append(`${data}`);
  });
}
