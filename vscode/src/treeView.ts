import { Event, EventEmitter, TreeDataProvider, TreeItem, window as Window } from "vscode";
import { App } from "./app";
import { Device } from "./device";
import { CommandContext, isAuthenticated, listApps, listDevices } from "./utils";

let viewRefresher: NodeJS.Timeout;

export function activateTreeView(ctx: CommandContext): void {
  viewRefresher = setInterval(() => ctx.refreshDeviceView(), 60000);
  const deviceDataProvider = new ToitDataProvider(ctx);
  Window.createTreeView("toitDeviceView", { "treeDataProvider": deviceDataProvider } );
  ctx.setDeviceProvider(deviceDataProvider);
}

export function deactivateTreeView(): void {
  clearInterval(viewRefresher);
}
export class ToitDataProvider implements TreeDataProvider<TreeItem> {

  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null> = new EventEmitter<TreeItem | undefined | null>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null> = this._onDidChangeTreeData.event;

  refresh(item?: TreeItem): void {
    this._onDidChangeTreeData.fire(item);
  }

  context: CommandContext;

  constructor(ctx: CommandContext) {
    this.context = ctx;
  }

  getParent(element: TreeItem): TreeItem | undefined {
    if (element instanceof App) return element.device();

    return undefined;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!await isAuthenticated(this.context)) return [];

    if (!element) {
      const deviceItems = await listDevices(this.context);
      return deviceItems.map(item => item.device());
    }
    if (element instanceof Device) return listApps(this.context, element);

    return [];
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
}
