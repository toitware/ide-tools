// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.
import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { DeviceInfo } from "./device";

export class SerialPort extends TreeItem {
  iconPath = new ThemeIcon("plug");
  name: string;
  constructor(port: string) {
    super(port, TreeItemCollapsibleState.Collapsed);
    this.name = port;
  }
}

export interface ConsoleSerialInfo {
  // The JSON from the CLI does not follow the naming-convention.
  /* eslint-disable @typescript-eslint/naming-convention */
  name: string;
  model: string;
  hardware_id: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export class SerialInfo extends TreeItem {
  name: string;
  model: string;
  hardwareID: string;

  constructor(info: ConsoleSerialInfo, deviceInfo?: DeviceInfo) {
    super(deviceInfo ? deviceInfo.name : info.name, TreeItemCollapsibleState.None);
    this.name = info.name;
    this.model = info.model;
    this.hardwareID = info.hardware_id;
    this.contextValue = "device-info";
    this.command = {
      "command": "toit.revealDevice",
      "arguments": [this.hardwareID],
      "title": "Goto device"
    };
  }
}
