
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

export class Package {
  name: string;
  description: string;
  license: string;
  url: string;
  version: string;
  dependencies: ConsoleDependency[];

  constructor(pkg: ConsolePackage) {
    this.name = pkg.name;
    this.description = pkg.description;
    this.license = pkg.license;
    this.url = pkg.url;
    this.version = pkg.version;
    this.dependencies = pkg.dependencies;
  }
}
