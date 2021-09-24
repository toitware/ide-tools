/* eslint-disable @typescript-eslint/naming-convention */

// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

export interface ConsoleProject {
  name: string;
  project_id: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class Project {
  name: string;
  projectID: string;

  constructor(project: ConsoleProject) {
    this.name = project.name;
    this.projectID = project.project_id;
  }
}
