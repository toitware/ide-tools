// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { mocked } from "ts-jest/utils";
import * as cli from "../../src/cli";
import { ConsoleDevice } from "../../src/device";
import { Context, DeviceItem, listDevices } from "../../src/utils";

jest.mock("../../src/cli");

const mockedCLI = mocked(cli.toitExecFilePromise);

describe("Device list", () => {
  const deviceJSON = {
    "stdout": `{"configured_firmware":"","device_id":"12345678-1234-1234-1234-12345678","is_active":false,"is_simulator":false,"last_seen":"1989-06-03T10:00:00Z","name":"test","running_firmware":"v1.1.2"}\n`,
    "stderr": ""
  };
  mockedCLI.mockResolvedValue(deviceJSON);

  const expectedDevices = {
  /* eslint-disable @typescript-eslint/naming-convention */
    "configured_firmware":"",
    "device_id":"12345678-1234-1234-1234-12345678",
    "is_active":false,
    "is_simulator":false,
    "last_seen":"1989-06-03T10:00:00Z",
    "name":"test",
    "running_firmware":"v1.1.2"
    /* eslint-enable @typescript-eslint/naming-convention */
  } as ConsoleDevice;

  const context = new Context();
  it( "List one device", () => expect(listDevices(context)).resolves.toStrictEqual([new DeviceItem(expectedDevices)]));
});
