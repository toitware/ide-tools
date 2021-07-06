import * as path from "path";
import { runCLI } from "@jest/core";

export function run(): Promise<void> {
  return new Promise<void>((c, e) => {
    // Generated files will be in out/, therefore we have another
    const projectRootPath = path.resolve(__dirname, "../../..");
    const config = path.join(projectRootPath, "jest.config.js");

    runCLI({"config": config, "$0": "", "_": []}, [projectRootPath]).
      then((jestCLICallResult) => {
        jestCLICallResult.results.testResults.forEach((testResult) => {
          testResult.testResults.
            filter((assertionResult) => assertionResult.status === "passed").
            forEach(({ ancestorTitles, title, status }) => {
              console.info(`  ● ${ancestorTitles} › ${title} (${status})`);
            });
        });

        jestCLICallResult.results.testResults.forEach((testResult) => {
          if (testResult.failureMessage) {
            console.error(testResult.failureMessage);
          }
        });
        c();
      }).catch((error) => {
        console.error(error);
        e(error);
      });
  });
}
