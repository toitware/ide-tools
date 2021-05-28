import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { Device, RelatedDevice } from "./device";
import { CommandContext, isAuthenticated, listDevices } from "./utils";

export class ToitDataProvider implements TreeDataProvider<DeviceTreeItem> {

  private _onDidChangeTreeData: EventEmitter<DeviceTreeItem | undefined | null> = new EventEmitter<DeviceTreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<DeviceTreeItem | undefined | null> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  context: CommandContext;

  constructor(ctx: CommandContext) {
    this.context = ctx;
  }

  async getChildren(element?: DeviceTreeItem): Promise<DeviceTreeItem[]> {
    if(!await isAuthenticated(this.context)) return [];

    if (element) return element.children();

    return listDevices(this.context).then(devices => devices.map(device => new DeviceTreeRoot(device)));
  }

  getTreeItem(element: DeviceTreeItem): TreeItem | Thenable<TreeItem> {
    return element.treeItem();
  }
}

export abstract class DeviceTreeItem implements RelatedDevice {
  dev: Device;

  constructor(dev: Device) {
    this.dev = dev;
  }

  device(): Device {
    return this.dev;
  }

  children(): DeviceTreeItem[] {
    return [];
  }

  abstract treeItem(): TreeItem;
}

class DeviceTreeRoot extends DeviceTreeItem {
  constructor(dev: Device) {
    super(dev);
  }

  children(): DeviceTreeItem[] {
    const children = [
      new DeviceTreeDevID(this.device()),
      new DeviceTreeLastSeen(this.device()),
      new DeviceTreeFirmware(this.device())
    ];
    if (this.device().isSimulator) {
      children.push(new DeviceTreeSimulator(this.device()));
    }

    return children;
  }

  treeItem(): TreeItem {
    return {
      "label": this.device().name,
      "collapsibleState": TreeItemCollapsibleState.Collapsed,
      "contextValue": "device"
    };
  }
}

class DeviceTreeDevID extends DeviceTreeItem {
  treeItem(): TreeItem {
    return {
      "label": this.device().deviceID,
      "collapsibleState": TreeItemCollapsibleState.None,
      "description": "device id"
    };
  }
}

class DeviceTreeLastSeen extends DeviceTreeItem {
  treeItem(): TreeItem {
    return {
      "label": this.device().lastSeen,
      "collapsibleState": TreeItemCollapsibleState.None,
      "description": "last seen"
    };
  }
}

class DeviceTreeFirmware extends DeviceTreeItem {
  treeItem(): TreeItem {
    return {
      "label": this.device().runningFirmware,
      "collapsibleState": TreeItemCollapsibleState.None,
      "description": this.device().configureFirmware ? `\u279f ${this.device().configureFirmware}` : "firmware version"
    };
  }
}

class DeviceTreeSimulator extends DeviceTreeItem {
  treeItem(): TreeItem {
    return {
      "label": "simulator",
      "collapsibleState": TreeItemCollapsibleState.None
    };
  }
}
