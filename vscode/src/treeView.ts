import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { CommandContext, Device, isAuthenticated, listDevices } from "./utils";

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

    if (element && element.children) return element.children;

    return listDevices(this.context).then(devices => devices.map(device => new DeviceTreeItem(device)));
  }

  getTreeItem(element: DeviceTreeItem): TreeItem | Thenable<TreeItem> {
    return element.item;
  }
}

class DeviceTreeItem {
  children?: DeviceTreeItem[];
  item: TreeItem;

  constructor(device: Device) {
    this.item = {
      "label": device.name,
      "collapsibleState": TreeItemCollapsibleState.Collapsed,
      "contextValue": "device"
    };
    this.children = [
      {
        "item": {
          "label": device.device_id,
          "collapsibleState": TreeItemCollapsibleState.None,
          "description": "device id"
        }
      },
      {
        "item": {
          "label": device.last_seen,
          "collapsibleState": TreeItemCollapsibleState.None,
          "description": "last seen"
        }
      },
      {
        "item": {
          "label": device.running_firmware,
          "collapsibleState": TreeItemCollapsibleState.None,
          "description": device.configure_firmware ? `\u279f ${device.configure_firmware}` : "firmware version"
        }
      }
    ];
    if (device.is_simulator) {
      this.children.push({
        "item": {
          "label": "simulator",
          "collapsibleState": TreeItemCollapsibleState.None
        }
      });
    }
  }
}
