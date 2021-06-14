import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class SerialPort extends TreeItem {
  iconPath = new ThemeIcon("plug");
  name: string;
  constructor(port: string) {
    super(port, TreeItemCollapsibleState.None);
    this.name = port;
  }
}
