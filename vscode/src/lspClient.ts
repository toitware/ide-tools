"use strict";

import * as fs from "fs";
import { platform } from "os";
import * as p from "path";
import { ExtensionContext, OutputChannel, RelativePattern, TextDocument, Uri, window as Window, workspace as Workspace, WorkspaceFolder } from "vscode";
import { DocumentSelector, LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient";
import { getToitPath } from "./utils";

// Untitled documents, or documents outside all workspaces go to a default client.
let nonFileClient: LanguageClient;
const clients: Map<string, LanguageClient> = new Map();
const clientCounts: Map<string, number> = new Map();
let _workspaceFolders: Set<string>|undefined;

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
  const folders = workspaceFolders();
  while (index !== -1) {
    const sub = str.substring(0, index + 1);
    if (folders.has(sub)) {
      return Workspace.getWorkspaceFolder(Uri.parse(sub))!;
    }
    index = str.indexOf(p.sep, index + 1);
  }
  return folder;
}



function startToitLsp(_: ExtensionContext,
    outputChannel: OutputChannel,
    config: ClientConfiguration) : LanguageClient {
  const workingDir = config.workingDir;
  const workspaceFolder = config.workspaceFolder;
  const scheme = config.scheme;
  const pattern = config.pattern;
  const lspSettings = Workspace.getConfiguration("toitLanguageServer", workspaceFolder);
  let toitPath = lspSettings.get("toitPath");
  let lspArguments: Array<string> | string | null | undefined = lspSettings.get("arguments");
  let debugClientToServer = !!lspSettings.get("debug.clientToServer");

  if (toitPath === null || toitPath === undefined) {
    toitPath = getToitPath();
  }
  if (lspArguments === null || lspArguments === undefined) {
    lspArguments = [ "tool", "lsp" ];
  }

  if (typeof lspArguments === "string") {
    lspArguments = [lspArguments];
  }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the normal ones are used
  let serverOptions: ServerOptions;
  if (debugClientToServer && platform() !== "linux") {
    debugClientToServer = false;
    Window.showInformationMessage("Client-Server debugging is only available on Linux");
  }
  if (debugClientToServer) {
    let toitCommand = (toitPath as string);
    for (const arg of lspArguments) {
      toitCommand += ' "' + arg + '"';
    }
    const logFile = "/tmp/debug_client_to_server-" + (new Date().toISOString()) + ".log";
    const args = [ "-c", 'tee "' + logFile + '" | ' + toitCommand ];

    serverOptions = {
      "command": "/bin/bash",
      "args": args,
      "options": {
        "cwd": workingDir
      }
    };
  } else {
    serverOptions = {
      "command": toitPath as string,
      "args": lspArguments,
      "options": {
        "cwd": workingDir
      }
    };
  }

  // Options of the language client
  const documentSelector: DocumentSelector = [{
    "language": "toit",
    "scheme": scheme,
    "pattern": ""+pattern
  }];

  const clientOptions: LanguageClientOptions = {
    "diagnosticCollectionName": "toit-lsp-server",
    "outputChannel": outputChannel,
    "documentSelector": documentSelector
  };
  if (workspaceFolder) {
    clientOptions.workspaceFolder = workspaceFolder;
  }

  const result = new LanguageClient("toitLanguageServer", "Language Server", serverOptions, clientOptions);
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
  }, () => {
    startFail = true;
  });
  return result;
}

export interface ClientConfiguration {
  workingDir?: string
  workspaceFolder?: WorkspaceFolder
  scheme: string
  pattern?: RelativePattern
}

export function activateLsp(context: ExtensionContext): void {
  const outputChannel: OutputChannel = Window.createOutputChannel("Toit LSP Server");

  function computeClientConfiguration(document: TextDocument): ClientConfiguration {
    const uri = document.uri;
    if (uri.scheme !== "file") {
      return {
        "workingDir": undefined,
        "workspaceFolder": undefined,
        "scheme": uri.scheme,
        "pattern": undefined
      };
    }
    const folder = Workspace.getWorkspaceFolder(uri);
    if (folder) {
      const outerFolder = getOuterMostWorkspaceFolder(folder);
      const workingDir = outerFolder.uri.fsPath;
      return {
        "workingDir": workingDir,
        "workspaceFolder": outerFolder,
        "scheme": "file",
        "pattern": new RelativePattern(outerFolder, "**/*")
      };
    }
    const path = uri.fsPath;
    let workingDir: string|undefined = p.dirname(path);
    const pattern = new RelativePattern(workingDir, "*");
    // Can't use a non-existing directory as working directory.
    while (!fs.existsSync(workingDir) ||
        !fs.statSync(workingDir).isDirectory) {
      workingDir = p.dirname(workingDir);
    }
    return {
      "workingDir": workingDir,
      "workspaceFolder": undefined,
      "scheme": "file",
      // Clients outside the working-dir only go one level deep.
      "pattern": pattern
    };
  }

  function didOpenTextDocument(document: TextDocument): void {
    if (document.languageId !== "toit") {
      return;
    }

    const config = computeClientConfiguration(document);

    if (config.scheme !== "file") {
      if (!nonFileClient) {
        nonFileClient = startToitLsp(context, outputChannel, config);
      }
      return;
    }
    const workingDir = config.workingDir!;
    if (!clients.has(workingDir)) {
      const client = startToitLsp(context, outputChannel, config);
      clients.set(workingDir, client);
      clientCounts.set(workingDir, 1);
    } else {
      const oldCount = clientCounts.get(workingDir)!;
      clientCounts.set(workingDir, oldCount + 1);
    }
  }

  function didCloseTextDocument(document: TextDocument): void {
    if (document.languageId !== "toit") {
      return;
    }

    const config = computeClientConfiguration(document);

    // We keep the non-file client until deactivation.
    if (config.scheme !== "file") {
      return;
    }

    const workingDir = config.workingDir!;
    if (clients.has(workingDir)) {
      const oldCount = clientCounts.get(workingDir)!;
      if (oldCount === 1) {
        const client = clients.get(workingDir)!;
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
    for (const folder of event.removed) {
      const uriString = folder.uri.toString();
      const client = clients.get(uriString);
      if (client) {
        clients.delete(uriString);
        client.stop();
      }
    }
  });
  Workspace.onDidCloseTextDocument(didCloseTextDocument);
}

export function deactivateLsp(): Thenable<void> {
  const promises: Thenable<void>[] = [];
  if (nonFileClient) {
    promises.push(nonFileClient.stop());
  }
  for (const client of clients.values()) {
    promises.push(client.stop());
  }
  return Promise.all(promises).then(() => undefined);
}
