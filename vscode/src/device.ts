
"use strict";

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

export class Device implements RelatedDevice {
  deviceID: string;
  isSimulator: boolean;
  name: string;
  configureFirmware: string;
  lastSeen: string;
  runningFirmware: string;

  constructor(consoleDev: ConsoleDevice) {
    this.deviceID = consoleDev.device_id;
    this.isSimulator = consoleDev.is_simulator;
    this.name = consoleDev.name;
    this.configureFirmware = consoleDev.configure_firmware;
    this.lastSeen = consoleDev.last_seen;
    this.runningFirmware = consoleDev.running_firmware;
  }

  device(): Device {
    return this;
  }
}
