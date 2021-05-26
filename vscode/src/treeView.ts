import { TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { CommandContext, Device } from "./utils";

export class ToitDataProvider implements TreeDataProvider<Device> {

  context: CommandContext;

  constructor(ctx: CommandContext) {
    this.context = ctx;
  }

  getChildren(element?: Device): Thenable<Device[]> {
    if (element) return Promise.resolve([]);

    return Promise.resolve([{"name": "hej"} as Device]); // listDevices(this.context);
  }

  getTreeItem(element: Device): TreeItem | Thenable<TreeItem> {
    return new DeviceItem(element);
  }

}


class DeviceItem extends TreeItem {
  device: Device;

  constructor(device: Device) {
    super(device.name, TreeItemCollapsibleState.Collapsed);
    this.device = device;
  }
}
