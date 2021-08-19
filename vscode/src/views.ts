import { TreeItem, TreeView } from "vscode";
import { DeviceProvider } from "./deviceView";
import { SerialProvider } from "./serialView";

export class Views {
  deviceProvider?: DeviceProvider;
  deviceView?: TreeView<TreeItem>;
  serialProvider?: SerialProvider;

  getDeviceView(): TreeView<TreeItem> | undefined {
    return this.deviceView;
  }

  setDeviceView(deviceView: TreeView<TreeItem>): void {
    this.deviceView = deviceView;
  }

  getDeviceProvider(): DeviceProvider | undefined {
    return this.deviceProvider;
  }

  setDeviceProvider(provider: DeviceProvider) : void {
    this.deviceProvider = provider;
  }

  setSerialProvider(provider: SerialProvider) : void {
    this.serialProvider = provider;
  }

  refreshViews(): void {
    this.refreshSerialView();
    this.refreshDeviceView();
  }

  refreshDeviceView(data?: TreeItem) : void {
    this.deviceProvider?.refresh(data);
  }

  refreshSerialView(data?: TreeItem) : void {
    this.serialProvider?.refresh(data);
  }
}
