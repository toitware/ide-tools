/* eslint-disable @typescript-eslint/naming-convention */

// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

export interface ConsoleOrganization {
  name: string;
  organization_id: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class Organization {
  name: string;
  organizationID: string;

  constructor(org: ConsoleOrganization) {
    this.name = org.name;
    this.organizationID = org.organization_id;
  }
}
