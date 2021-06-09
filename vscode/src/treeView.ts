import * as path from "path";
import { Event, EventEmitter, MarkdownString, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window as Window } from "vscode";
import { App, RelatedApp } from "./app";
import { Device, RelatedDevice } from "./device";
import { CommandContext, isAuthenticated, listApps, listDevices } from "./utils";

let viewRefresher: NodeJS.Timeout;

export function activateTreeView(ctx: CommandContext) {
  viewRefresher = setInterval(() => ctx.refreshDeviceView(), 60000);
  const deviceDataProvider = new ToitDataProvider(ctx);
  Window.createTreeView("toitDeviceView", { "treeDataProvider": deviceDataProvider } );
  ctx.setDeviceProvider(deviceDataProvider);
}

export function deactivateTreeView() {
  clearInterval(viewRefresher);
}
export class ToitDataProvider implements TreeDataProvider<DeviceTreeItem> {

  private _onDidChangeTreeData: EventEmitter<DeviceTreeItem | undefined | null> = new EventEmitter<DeviceTreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<DeviceTreeItem | undefined | null> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  context: CommandContext;

  constructor(ctx: CommandContext) {
    this.context = ctx;
  }

  async getChildren(element?: DeviceTreeItem): Promise<DeviceTreeItem[]> {
    if(!await isAuthenticated(this.context)) return [];

    if (element) return element.children();

    return listDevices(this.context).then(devices => devices.map(device => new DeviceTreeRoot(this.context, device)));
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

  async children(): Promise<DeviceTreeItem[]> {
    return [];
  }

  abstract treeItem(): TreeItem;
}

class DeviceTreeRoot extends DeviceTreeItem {
  static activeIcons = {
    "light": path.join(__filename, "..", "..", "resources", "light", "active.svg"),
    "dark": path.join(__filename, "..", "..", "resources", "dark", "active.svg")
  };
  static inactiveIcons = {
    "light": path.join(__filename, "..", "..", "resources", "light", "inactive.svg"),
    "dark": path.join(__filename, "..", "..", "resources", "dark", "inactive.svg")
  };
  context: CommandContext;
  constructor(context: CommandContext, dev: Device) {
    super(dev);
    this.context = context;
  }

  async children(): Promise<DeviceTreeItem[]> {
    const apps = await listApps(this.context, this.device());
    return apps.map(app => new DeviceApp(app, this.device()));
  }

  treeItem(): TreeItem {
    const device = this.device();
    const contextValue = device.isSimulator ? "device-simulator" : "device";
    const label = device.name;
    const icons = device.isActive ? DeviceTreeRoot.activeIcons : DeviceTreeRoot.inactiveIcons;
    const tooltipMarkdown =
`
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
    return new class extends TreeItem {
      constructor() {
        super(label, TreeItemCollapsibleState.Collapsed);
      }
      contextValue = contextValue;
      iconPath = icons;
      tooltip = new MarkdownString(tooltipMarkdown);
    }();
  }
}

class DeviceApp extends DeviceTreeItem implements RelatedApp {
  application: App;

  constructor(app: App, dev: Device) {
    super(dev);
    this.application = app;
  }

  treeItem(): TreeItem {
    const app = this.app();
    return new class extends TreeItem {
      constructor() {
        super(app.jobName, TreeItemCollapsibleState.None);
      }
      contextValue = "application";
      iconPath = {
        "light": path.join(__filename, "..", "..", "resources", "light", "app.svg"),
        "dark": path.join(__filename, "..", "..", "resources", "dark", "app.svg")
      };
    }();
  }

  app(): App {
    return this.application;
  }
}
