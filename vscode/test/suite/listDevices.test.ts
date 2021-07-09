// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { mocked } from "ts-jest/utils";
import * as cli from "../../src/cli";
import { ConsoleDevice } from "../../src/device";
import { Context, DeviceItem, listDevices } from "../../src/utils";

jest.mock("../../src/cli");

const mockedCLI = mocked(cli.toitExecFilePromise);

const noDevices = "\n";
const oneDevice = `{"configured_firmware":"","device_id":"12345678-1234-1234-1234-12345678","is_active":false,"is_simulator":false,"last_seen":"1989-06-03T10:00:00Z","name":"test1","running_firmware":"v1.1.2"}`;
const twoDevices = `{"configured_firmware":"","device_id":"12345678-1234-1234-1234-12345678","is_active":false,"is_simulator":false,"last_seen":"1989-06-03T10:00:00Z","name":"test1","running_firmware":"v1.1.2"}
{"configured_firmware":"","device_id":"01234567-0123-0123-0123-01234567","is_active":false,"is_simulator":false,"last_seen":"1989-07-03T10:00:00Z","name":"test2","running_firmware":"v1.1.2"}`;


describe("Device list", () => {
  mockedCLI.mockResolvedValueOnce({
    "stdout": noDevices,
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": oneDevice,
    "stderr": ""
  }).mockResolvedValue({
    "stdout": twoDevices,
    "stderr": ""
  });
  const context = new Context();
  it("List no device", () => expect(listDevices(context)).resolves.toStrictEqual([]));

  const device1 = {
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

  it("List one device", () => expect(listDevices(context)).resolves.toStrictEqual([new DeviceItem(device1)]));

  mockedCLI.mockResolvedValue({
    "stdout": twoDevices,
    "stderr": ""
  });
  const device2 = {
    /* eslint-disable @typescript-eslint/naming-convention */
    "configured_firmware":"",
    "device_id":"01234567-0123-0123-0123-01234567",
    "is_active":false,
    "is_simulator":false,
    "last_seen":"1989-07-03T10:00:00Z",
    "name":"test2",
    "running_firmware":"v1.1.2"
    /* eslint-enable @typescript-eslint/naming-convention */
  } as ConsoleDevice;

  it("List two devices", () => expect(listDevices(context)).resolves.toStrictEqual([ new DeviceItem(device1), new DeviceItem(device2) ]));
});
