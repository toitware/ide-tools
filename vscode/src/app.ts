"use strict";

export interface RelatedApp {
  app(): App;
}

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

export class App implements RelatedApp {
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

  constructor(app: ConsoleApp) {
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
  }

  app(): App {
    return this;
  }

}
