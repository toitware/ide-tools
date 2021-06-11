import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { Device, RelatedDevice } from "./device";

export interface RelatedApp {
  app(): App;
}

/* eslint-disable @typescript-eslint/naming-convention */
export interface ConsoleApp {
  compilation_id: string;
  created: string;
  device_id: string;
  goalstate: number;
  job_id: string;
  job_name: string;
  program_id: string;
  program_name: string;
  sdk: string;
  state: number;
  updated: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class App extends TreeItem implements RelatedApp, RelatedDevice {
  compilationId: string;
  created: string;
  deviceID: string;
  goalstate: number;
  jobID: string;
  jobName: string;
  programID: string;
  programName: string;
  sdk: string;
  state: number;
  updated: string;

  dev: Device;

  constructor(app: ConsoleApp, dev: Device) {
    super(app.job_name, TreeItemCollapsibleState.None);
    this.compilationId = app.compilation_id;
    this.created = app.created;
    this.deviceID = app.device_id;
    this.goalstate = app.goalstate;
    this.jobID = app.job_id;
    this.jobName = app.job_name;
    this.programID = app.program_id;
    this.programName = app.program_name;
    this.sdk = app.sdk;
    this.state = app.state;
    this.updated = app.updated;

    this.dev = dev;

    // TreeItem fields
    this.contextValue = "application";
    this.iconPath = new ThemeIcon("primitive-square");
  }

  app(): App {
    return this;
  }

  device(): Device {
    return this.dev;
  }

}
