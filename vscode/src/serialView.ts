// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { Event, EventEmitter, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window as Window } from "vscode";
import { Context, isAuthenticated, listPorts } from "./utils";

let viewRefresher: NodeJS.Timeout;

export function activateSerialView(ctx: Context): void {
  viewRefresher = setInterval(() => ctx.refreshDeviceView(), 60000);
  const provider = new SerialProvider(ctx);
  Window.createTreeView("toitSerialView", { "treeDataProvider": provider } );
  ctx.setSerialProvider(provider);
}

export function deactivateSerialView(): void {
  clearInterval(viewRefresher);
}
export class SerialProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null> = new EventEmitter<TreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null> = this._onDidChangeTreeData.event;

  refresh(item?: TreeItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  context: Context;

  constructor(ctx: Context) {
    this.context = ctx;
  }

  getParent(_element: TreeItem): TreeItem | undefined {
    return undefined;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!await isAuthenticated(this.context)) return [];

    if (element) return [];

    const ports = await listPorts(this.context);
    return ports.map(port => new class extends TreeItem {
      iconPath = new ThemeIcon("plug");
      constructor() {
        super(port, TreeItemCollapsibleState.None);
      }
    }());
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
}
