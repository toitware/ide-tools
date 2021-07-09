// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.
import { mocked } from "ts-jest/utils";
import { App, ConsoleApp } from "../../src/app";
import { ConsoleDevice, Device } from "../../src/device";
import { createUninstallCommand } from "../../src/toitUninstall";
import * as utils from "../../src/utils";
import { Context } from "../../src/utils";

jest.mock("../../src/utils");

const mockedEnsureAuth = mocked(utils.ensureAuth);

const testApp = {
  /* eslint-disable @typescript-eslint/naming-convention */
  "compilation_id": "01234567-0123-0123-0123-01234567",
  "created": "2021-07-02T12:55:57Z",
  "device_id": "01234567-0123-0123-0123-01234567",
  "goalstate": 0,
  "job_id": "01234567-0123-0123-0123-01234567",
  "job_name": "test",
  "program_id": "01234567-0123-0123-0123-01234567",
  "program_name": "test",
  "sdk": "v1.0.2",
  "state": 3,
  "updated": "2021-07-02T12:55:57Z"
  /* eslint-enable @typescript-eslint/naming-convention */
} as ConsoleApp;

const device = {
  /* eslint-disable @typescript-eslint/naming-convention */
  "configured_firmware":"",
  "device_id":"12345678-1234-1234-1234-12345678",
  "is_active":false,
  "is_simulator":false,
  "last_seen":"1989-06-03T10:00:00Z",
  "name":"test1",
  "running_firmware":"v1.1.2"
  /* eslint-enable @typescript-eslint/naming-convention */
} as ConsoleDevice;

describe("Auth before uninstall", () => {
  const context = new Context();
  const uninstall = createUninstallCommand(context);
  uninstall(new App(testApp, new Device(device)));
  it("Uninstall should ensure auth", () => expect(mockedEnsureAuth.mock.calls.length).toBe(1));
});
