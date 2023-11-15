// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.
import "jest"
import "jest-mock"
import { App } from "../../src/app";
import { Device } from "../../src/device";
import { createUninstallCommand } from "../../src/toitUninstall";
import * as utils from "../../src/utils";
import { Context } from "../../src/utils";
import { app1, device1 } from "./testUtils";

jest.mock("../../src/utils");

const mockedEnsureAuth = jest.mocked(utils.ensureAuth);

describe("Auth before uninstall", () => {
  const context = new Context("toit");
  const uninstall = createUninstallCommand(context);
  uninstall(new App(app1, new Device(device1)));
  it("Uninstall should ensure auth", () => expect(mockedEnsureAuth.mock.calls.length).toBe(1));
});
