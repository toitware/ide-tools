import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class SerialPort extends TreeItem {
  iconPath = new ThemeIcon("plug");
  constructor(port: string) {
    super(port, TreeItemCollapsibleState.None);
  }
}
