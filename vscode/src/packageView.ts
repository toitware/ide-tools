// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { compare } from "semver";
import { Event, EventEmitter, TreeDataProvider, TreeItem, window as Window } from "vscode";
import { Package, Version } from "./package";
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
  versions?: Map<string, Version[]>;
  packages?: Array<Package>;

  refresh(item?: TreeItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  context: Context;

  constructor(ctx: Context) {
    this.context = ctx;
  }

  async loadPackages(): Promise<void> {
    const packages = await listPackages(this.context);
    this.versions = new Map<string, Version[]>();
    this.packages = [];
    packages.forEach( (pkg: Package) => {
      if (!this.versions?.has(pkg.url)) {
        this.versions?.set(pkg.url, []);
        this.packages?.push(pkg);
      }
      this.versions?.get(pkg.url)?.push(new Version(pkg));
    });
    for (const versions of this.versions?.values()) {
      versions.sort((a: Version, b: Version) => compare(a.pkg.version, b.pkg.version));
    }
    return;
  }

  getParent(element: TreeItem): TreeItem | undefined {
    if (element instanceof Version) return element.pkg;

    return undefined;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    await this.loadPackages();
    if (element instanceof Package) {
      const res =  this.versions?.get(element.url);
      return res ? res : [];
    }

    if (!this.packages) return [];

    return this.packages;
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
}
