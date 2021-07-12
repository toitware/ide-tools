// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { mocked } from "ts-jest/utils";
import * as cli from "../../src/cli";
import { Context, DeviceItem, listDevices } from "../../src/utils";
import { device1, device2, strDevice1, strDevice2 } from "./testUtils";

jest.mock("../../src/cli");

const mockedCLI = mocked(cli.toitExecFilePromise);



describe("Device list", () => {
  mockedCLI.mockResolvedValueOnce({
    "stdout": "\n",
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": `${strDevice1}\n`,
    "stderr": ""
  }).mockResolvedValue({
    "stdout": `${strDevice1}\n${strDevice2}\n`,
    "stderr": ""
  });
  const context = new Context();
  it("List no device", () => expect(listDevices(context)).resolves.toStrictEqual([]));

  it("List one device", () => expect(listDevices(context)).resolves.toStrictEqual([new DeviceItem(device1)]));

  mockedCLI.mockResolvedValue({
    "stdout": `${strDevice1}\n${strDevice2}\n`,
    "stderr": ""
  });

  it("List two devices", () => expect(listDevices(context)).resolves.toStrictEqual([ new DeviceItem(device1), new DeviceItem(device2) ]));
});
