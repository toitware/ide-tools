// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class SerialPort extends TreeItem {
  iconPath = new ThemeIcon("plug");
  name: string;
  constructor(port: string) {
    super(port, TreeItemCollapsibleState.None);
    this.name = port;
  }
}
