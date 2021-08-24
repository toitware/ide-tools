// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { Event, EventEmitter, TreeDataProvider, TreeItem, window as Window } from "vscode";
import { SerialInfo, SerialPort, SerialStatus } from "./serialPort";
import { Context, getSerialInfo, isAuthenticated, listPorts } from "./utils";

export function activateSerialView(ctx: Context): void {
  const provider = new SerialProvider(ctx);
  Window.createTreeView("toitSerialView", { "treeDataProvider": provider } );
  ctx.views.setSerialProvider(provider);
}
export class SerialProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null> = new EventEmitter<TreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null> = this._onDidChangeTreeData.event;

  infoCache: Map<string, SerialInfo> = new Map();

  refresh(item?: TreeItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  context: Context;

  constructor(ctx: Context) {
    this.context = ctx;
  }

  getParent(): TreeItem | undefined {
    return undefined;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!await isAuthenticated(this.context)) return [];

    if (element) {
      if (element instanceof SerialPort) {
        const info = await getSerialInfo(this.context, element);
        if (info === SerialStatus.Busy) {
          const cachedValue = this.infoCache.get(element.name);
          return cachedValue ? [cachedValue] : [];
        }

        if (info instanceof SerialInfo) {
          this.infoCache.set(element.name, info);
          return [info];
        }
        this.infoCache.delete(element.name);
      }
      return [];
    }
    const ports = await listPorts(this.context);
    return ports.map(port => new SerialPort(port));
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
}
