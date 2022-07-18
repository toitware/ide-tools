# Toit for Visual Studio Code

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)

The Toit extension adds language support for the Toit programming language, including syntax highlighting, integrated static analysis, and code completion.

## Quick start

### toitlang.org
The easiest way to set it up is to download the [Jaguar](https://github.com/toitlang/jaguar)
tool and install it, so that `jag` or `jag.exe` is in your path.

* Windows: `winget jaguar`
* macOs: `brew install toitlang/toit/jag`
* Archlinux: `yay -S jaguar-bin`

If the Jaguar executable is not in your path you can also set the `jag.path` setting, so it
points to the location of your `jag`.

The following commands are supported:
- `jag.flash`: Flashes the connected device with Jaguar.
- `jag.scan`: Scans for devices that haven been flashed with Jaguar.
- `jag.monitor`: Monitors the serial output of the connected device.
- `jag.run`: Runs a file on the device.
- `jag.watch`: Watches a file for changes and reruns it automatically on every change.

### toit.io
In this configuration the extension uses the `toit` CLI to connect to the Toit servers.

All of the extension's features are activated in this mode.

- _Step 1:_ Install [Toit](https://docs.toit.io/getstarted/installation) and the [Toit Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=toit.toit).
- _Step 2:_ Either place `toit` in your path or set `toit.path` to the location of `toit`.
- _Step 3:_ The extension is activated when you open a `.toit` file.

The extension is now set up and ready to use. Visit the [Toit docs](https://docs.toit.io/) for more information about Toit.
