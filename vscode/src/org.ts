"use strict";

export interface ConsoleOrganization {
  name: string;
  organization_id: string;
}

export class Organization {
  name: string;
  organizationID: string;

  constructor(org: ConsoleOrganization) {
    this.name = org.name;
    this.organizationID = org.organization_id;
  }
}
