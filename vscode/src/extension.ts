import { commands as Commands, workspace as Workspace, ExtensionContext, window as Window, OutputChannel, TextDocument, WorkspaceFolder, Uri, RelativePattern } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, DocumentSelector } from 'vscode-languageclient';
import { platform } from 'os';
import * as fs from 'fs';
import * as p from 'path';
import { createRunCommand } from './toitRun'

// Untitled documents, or documents outside all workspaces go to a default client.
let nonFileClient: LanguageClient;
let clients: Map<string, LanguageClient> = new Map();
let clientCounts: Map<string, number> = new Map();
let _workspaceFolders: Set<string>|undefined = undefined;

function workspaceFolders(): Set<string> {
  if (_workspaceFolders === undefined) {
    _workspaceFolders = new Set<string>();
    if (!Workspace.workspaceFolders) {
      return _workspaceFolders;
    }
    Workspace.workspaceFolders.forEach(folder => {
      let str = folder.uri.toString();
      if (str.charAt(str.length - 1) !== p.sep) {
          str += p.sep;
      }
      _workspaceFolders?.add(str);
    });
  }
  return _workspaceFolders as Set<string>;
}

Workspace.onDidChangeWorkspaceFolders(() => _workspaceFolders = undefined);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
  let str = folder.uri.toString();
  if (str.charAt(str.length - 1) !== p.sep) {
      str += p.sep;
  }
  let index = str.indexOf(p.sep);
  let folders = workspaceFolders();
  while (index !== -1) {
    let sub = str.substring(0, index + 1);
    if (folders.has(sub)) {
        return Workspace.getWorkspaceFolder(Uri.parse(sub))!;
    }
    index = str.indexOf(p.sep, index + 1);
  }
  return folder;
}

function startToitLsp(_: ExtensionContext,
                      outputChannel: OutputChannel,
                      config: any) : LanguageClient {
  let workingDir = config.workingDir;
  let workspaceFolder = config.workspaceFolder;
  let scheme = config.scheme;
  let pattern = config.pattern;
  let lspSettings = Workspace.getConfiguration('toitLanguageServer', workspaceFolder);
  var toitPath = lspSettings.get('toitPath');
  var lspArguments: Array<string> | string | null | undefined = lspSettings.get('arguments');
  var debugClientToServer = !!lspSettings.get('debug.clientToServer');

  if (toitPath === null || toitPath === undefined) {
    toitPath = "toit"; // Assume `toit` is visible in the global environment.
  }
  if (lspArguments === null || lspArguments === undefined) {
    lspArguments = ["tool", "lsp"];
  }

  if (typeof lspArguments === "string") {
    lspArguments = [lspArguments];
  }



  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the normal ones are used
  let serverOptions: ServerOptions;
  if (debugClientToServer && platform() !== 'linux') {
    debugClientToServer = false;
    Window.showInformationMessage("Client-Server debugging is only available on Linux");
  }
  if (debugClientToServer) {
    var toitCommand = (toitPath as string);
    for (var arg of lspArguments) {
      toitCommand += ' "' + arg + '"';
    }
    var logFile = "/tmp/debug_client_to_server-" + (new Date().toISOString()) + ".log";
    var args = ['-c', 'tee "' + logFile + '" | ' + toitCommand];

    serverOptions = {
      command: '/bin/bash',
      args: args,
      options: {
        cwd: workingDir,
      }
    };
  } else {
    serverOptions = {
      command: toitPath as string,
      args: lspArguments,
      options: {
        cwd: workingDir,
      }
    };
  }

  // Options of the language client
  let documentSelector: DocumentSelector = [{
    language: 'toit',
    scheme: scheme,
    pattern: pattern,
  }];

  let clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: 'toit-lsp-server',
    outputChannel: outputChannel,
    documentSelector: documentSelector,
  };
  if (workspaceFolder) {
      clientOptions.workspaceFolder = workspaceFolder;
  }

  let result = new LanguageClient('toitLanguageServer', 'Language Server', serverOptions, clientOptions);
  result.start();
  let isReady = false;
  let startFail = false;
  setTimeout(() => {
    // If the start failed, then VSCode already reported an error message.
    // We could add an additional one to point the user to the trouble-shooting guide.
    if (!startFail && !isReady) {
      Window.showErrorMessage("The Language Server is not responding. Consult the documentation.");
    }
  }, 3000);
  result.onReady().then(() => {
    // At this point the language server responded to requests (`initialize`), and
    //   is thus running.
    isReady = true;
  }, (_) => {
    startFail = true;
  });
  return result;
}

export function activate(context: ExtensionContext) {
  let toit_output = Window.createOutputChannel("Toit");
  context.subscriptions.push(Commands.registerCommand('toit.hello', createRunCommand(toit_output)));

  let outputChannel: OutputChannel = Window.createOutputChannel('Toit LSP Server');

  function computeClientConfiguration(document: TextDocument) {
    let uri = document.uri;
    if (uri.scheme !== 'file') {
      return {
        workingDir: undefined,
        workspaceFolder: undefined,
        scheme: uri.scheme,
        pattern: undefined,
      };
    }
    let folder = Workspace.getWorkspaceFolder(uri);
    if (folder) {
      let outerFolder = getOuterMostWorkspaceFolder(folder);
      let workingDir = outerFolder.uri.fsPath;
      return {
        workingDir: workingDir,
        workspaceFolder: outerFolder,
        scheme: "file",
        pattern: new RelativePattern(outerFolder, "**/*"),
      };
    }
    let path = uri.fsPath;
    let workingDir: string|undefined = p.dirname(path);
    let pattern = new RelativePattern(workingDir, "*");
    // Can't use a non-existing directory as working directory.
    while (!fs.existsSync(workingDir) ||
        !fs.statSync(workingDir).isDirectory) {
      workingDir = p.dirname(workingDir);
    }
    return {
      workingDir: workingDir,
      workspaceFolder: undefined,
      scheme: "file",
      // Clients outside the working-dir only go one level deep.
      pattern: pattern,
    };
  }

  function didOpenTextDocument(document: TextDocument): void {
    if (document.languageId !== 'toit') {
        return;
    }

    let config = computeClientConfiguration(document);

    if (config.scheme !== "file") {
      if (!nonFileClient) {
        nonFileClient = startToitLsp(context, outputChannel, config);
      }
      return;
    }
    let workingDir = config.workingDir!;
    if (!clients.has(workingDir)) {
      let client = startToitLsp(context, outputChannel, config);
      clients.set(workingDir, client);
      clientCounts.set(workingDir, 1);
    } else {
      let oldCount = clientCounts.get(workingDir)!;
      clientCounts.set(workingDir, oldCount + 1);
    }
  }

  function didCloseTextDocument(document: TextDocument): void {
    if (document.languageId !== 'toit') {
        return;
    }

    let config = computeClientConfiguration(document);

    // We keep the non-file client until deactivation.
    if (config.scheme !== "file") {
        return;
    }

    let workingDir = config.workingDir!;
    if (clients.has(workingDir)) {
      let oldCount = clientCounts.get(workingDir)!;
      if (oldCount === 1) {
        let client = clients.get(workingDir)!;
        clients.delete(workingDir);
        clientCounts.delete(workingDir);
        client.stop();
      } else {
        clientCounts.set(workingDir, oldCount - 1);
      }
    }
  }

  Workspace.onDidOpenTextDocument(didOpenTextDocument);
  Workspace.textDocuments.forEach(didOpenTextDocument);
  Workspace.onDidChangeWorkspaceFolders(event => {
    for (let folder of event.removed) {
      let uriString = folder.uri.toString();
      let client = clients.get(uriString);
      if (client) {
        clients.delete(uriString);
        client.stop();
      }
    }
  });
  Workspace.onDidCloseTextDocument(didCloseTextDocument);
}

export function deactivate(): Thenable<void> {
  let promises: Thenable<void>[] = [];
  if (nonFileClient) {
      promises.push(nonFileClient.stop());
  }
  for (let client of clients.values()) {
      promises.push(client.stop());
  }
  return Promise.all(promises).then(() => undefined);
}
