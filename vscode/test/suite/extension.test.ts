// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

describe("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  it("Sample test", () => {
    expect([ 1, 2, 3 ].indexOf(5)).toBe(-1);
    expect([ 1, 2, 3 ].indexOf(0)).toBe(-1);
  });
});
