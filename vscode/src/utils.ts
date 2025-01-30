// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { InputBoxOptions, OpenDialogOptions, window as Window } from "vscode";

export interface WiFiInfo {
  ssid: string;
  password: string;
}

export async function promptForWiFiInfo(): Promise<WiFiInfo | undefined> {
  const ssidPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi SSID"
  };
  const ssid = await Window.showInputBox(ssidPromptOptions);
  if (!ssid) return undefined;

  const passwordPromptOptions: InputBoxOptions = {
    "prompt": "Enter Wi-Fi password",
    "password": true
  };
  const password = await Window.showInputBox(passwordPromptOptions);
  if (password === undefined) return undefined;

  return { "ssid": ssid, "password": password};
}

export function preferElement<T>(index: number, list: T[]): void {
  if (index <= 0) return;
  const preferred = list[index];
  list.splice(index, 1);
  list.unshift(preferred);
}

export const TOIT_SHORT_VERSION_ARGS = [ "version", "-o", "short" ];

export const TOIT_LSP_ARGS = [ "tool", "lsp" ];

async function pickFile(dialogOptions: OpenDialogOptions): Promise<string | undefined> {
  const fileURI = await Window.showOpenDialog(dialogOptions);
  if (!fileURI) return;  // File selection prompt dismissed.

  return fileURI[0].fsPath;
}


export async function getExecuteFilePath(suffix: string, dialogOptions: OpenDialogOptions): Promise<string | undefined> {
  const editor = Window.activeTextEditor;
  if (!editor) return await pickFile(dialogOptions);

  const filePath = editor.document.fileName;
  if (!(filePath.endsWith(suffix))) return await pickFile(dialogOptions);

  return filePath;
}
