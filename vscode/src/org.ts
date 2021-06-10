/* eslint-disable @typescript-eslint/naming-convention */
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
