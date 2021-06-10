import * as path from "path";
import { MarkdownString, TreeItem, TreeItemCollapsibleState } from "vscode";

/**
 * Method for retrieving the related device.
 */
export interface RelatedDevice {
  device(): Device;
}

export interface ConsoleDevice {
  // The JSON from console does not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  device_id: string;
  is_simulator: boolean;
  name: string;
  configure_firmware: string;
  last_seen: string;
  running_firmware: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export class Device extends TreeItem implements RelatedDevice {
  static activeIcons = {
    "light": path.join(__filename, "..", "..", "resources", "light", "active.svg"),
    "dark": path.join(__filename, "..", "..", "resources", "dark", "active.svg")
  };
  static inactiveIcons = {
    "light": path.join(__filename, "..", "..", "resources", "light", "inactive.svg"),
    "dark": path.join(__filename, "..", "..", "resources", "dark", "inactive.svg")
  };

  deviceID: string;
  isSimulator: boolean;
  name: string;
  configureFirmware: string;
  lastSeen: string;
  runningFirmware: string;
  isActive: boolean;

  constructor(consoleDev: ConsoleDevice, active: boolean) {
    super(consoleDev.name, TreeItemCollapsibleState.Collapsed);
    this.isActive = active;
    this.deviceID = consoleDev.device_id;
    this.isSimulator = consoleDev.is_simulator;
    this.name = consoleDev.name;
    this.configureFirmware = consoleDev.configure_firmware;
    this.lastSeen = consoleDev.last_seen;
    this.runningFirmware = consoleDev.running_firmware;

    // TreeItem fields
    this.id = this.deviceID;
    this.contextValue = this.isSimulator ? "device-simulator" : "device";
    this.iconPath = this.isActive ? Device.activeIcons : Device.inactiveIcons;
    this.tooltip = new MarkdownString(Device.generateMarkdownString(this));
  }

  static generateMarkdownString(device: Device): string {
    return `
### ${device.name} ${device.isSimulator ? "(simulator)" : ""}

--------------------------------
#### Device ID

${device.deviceID}

--------------------------------
#### Firmware

${device.runningFirmware} ${device.configureFirmware ? `\u279f ${device.configureFirmware}` : ""}

--------------------------------
#### Last seen

${new Date(device.lastSeen).toLocaleTimeString(undefined)}

${new Date(device.lastSeen).toLocaleDateString(undefined, {"weekday": "long", "year": "numeric", "month": "long", "day": "numeric"})}
`;
  }

  device(): Device {
    return this;
  }
}
