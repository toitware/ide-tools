// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { Event, EventEmitter, TreeDataProvider, TreeItem, window as Window } from "vscode";
import { Context, listPackages } from "./utils";

export function activatePackageView(ctx: Context): void {
  const packageDataProvider = new PackageProvider(ctx);
  const packageView = Window.createTreeView("toitPackageView", { "treeDataProvider": packageDataProvider } );
  ctx.setPackageView(packageView);
  ctx.setPackageProvider(packageDataProvider);
}

export function deactivatePackageView(): void {
  return;
}

export class PackageProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null> = new EventEmitter<TreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null> = this._onDidChangeTreeData.event;


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
    if (element) return [];

    return await listPackages(this.context);
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
}
