import { TreeItem, TreeItemCollapsibleState } from "vscode";

export interface ConsolePackage {
  // The JSON from console may not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  name: string;
  description: string
  license: string
  url: string
  version: string
  dependencies: ConsoleDependency[]
  /* eslint-enable @typescript-eslint/naming-convention */
}

export interface ConsoleDependency {
  // The JSON from console may not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  url: string
  version: string
  /* eslint-enable @typescript-eslint/naming-convention */
}

export class Package extends TreeItem  {
  name: string;
  desc: string;
  license: string;
  url: string;
  version: string;
  dependencies: ConsoleDependency[];

  constructor(pkg: ConsolePackage) {
    super(pkg.name, TreeItemCollapsibleState.None);
    this.name = pkg.name;
    this.desc = pkg.description;
    this.license = pkg.license;
    this.url = pkg.url;
    this.version = pkg.version;
    this.dependencies = pkg.dependencies;

    this.id = this.url + "@" + this.version;
    this.contextValue = "package";
    this.description = this.version;
  }
}
