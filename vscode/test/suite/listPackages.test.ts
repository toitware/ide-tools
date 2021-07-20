// Copyright (C) 2021 Toitware ApS. All rights reserved.
// Use of this source code is governed by an MIT-style license that can be
// found in the LICENSE file.

import { mocked } from "ts-jest/utils";
import * as cli from "../../src/cli";
import { Package } from "../../src/package";
import { Context, listPackages } from "../../src/utils";
import { pkg1, pkg2, pkg3, strPkg1, strPkg2, strPkg3 } from "./testUtils";

jest.mock("../../src/cli");

const mockedCLI = mocked(cli.toitExecFilePromise);



describe("Packages list", () => {
  const context = new Context();
  mockedCLI.mockResolvedValueOnce({
    "stdout": "sync",
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": `toit: github.com/toitware/registry:\n`,
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": "sync",
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": `toit: github.com/toitware/registry:\n${strPkg1}\n`,
    "stderr": ""
  }).mockResolvedValueOnce({
    "stdout": "sync",
    "stderr": ""
  }).mockResolvedValue({
    "stdout": `toit: github.com/toitware/registry:\n${strPkg1}\n${strPkg2}\n${strPkg3}\n`,
    "stderr": ""
  });
  it("List no packages", () => expect(listPackages(context)).resolves.toStrictEqual([]));

  it("List one package", () => expect(listPackages(context)).resolves.toStrictEqual([new Package(pkg1)]));
  it("List three packages", () => expect(listPackages(context)).resolves.toStrictEqual([ new Package(pkg1), new Package(pkg2), new Package(pkg3) ]));
});
