"use strict";

import { commands as Commands, ExtensionContext, window as Window } from 'vscode';
import { activateLsp, deactivateLsp } from './lspClient';
import { createDeployCommand, createRunCommand } from './toitExec';

export function activate(context: ExtensionContext) {
  let toitOutput = Window.createOutputChannel('Toit');
  context.subscriptions.push(Commands.registerCommand('toit.devRun', createRunCommand(toitOutput)));
  context.subscriptions.push(Commands.registerCommand('toit.devDeploy', createDeployCommand(toitOutput)));

  activateLsp(context);
}

export function deactivate(): Thenable<void> {
  return deactivateLsp();
}
