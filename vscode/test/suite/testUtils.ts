import { ConsoleApp } from "../../src/app";
import { ConsoleDevice } from "../../src/device";

export const device1 = {
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

export const device2 = {
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

export const app1 = {
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

export const strDevice1 = `{"configured_firmware":"","device_id":"12345678-1234-1234-1234-12345678","is_active":false,"is_simulator":false,"last_seen":"1989-06-03T10:00:00Z","name":"test1","running_firmware":"v1.1.2"}`;
export const strDevice2 = `{"configured_firmware":"","device_id":"01234567-0123-0123-0123-01234567","is_active":false,"is_simulator":false,"last_seen":"1989-07-03T10:00:00Z","name":"test2","running_firmware":"v1.1.2"}`;
