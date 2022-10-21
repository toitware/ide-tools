# Toit for Visual Studio Code

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)

The Toit extension adds language support for the Toit programming language, including syntax highlighting, integrated static analysis, and code completion.

## Quick start

The easiest way to set it up is to download the [Jaguar](https://github.com/toitlang/jaguar)
tool and install it, so that `jag` or `jag.exe` is in your path.

* Windows: `winget install --id=Toit.Jaguar -e`
* macOS: `brew install toitlang/toit/jag`
* Archlinux: `yay -S jaguar-bin`

If the Jaguar executable is not in your path, you can also update the `jag.path` setting, so it
points to the location of your `jag` executable.

The following commands are supported:
- `jag.flash`: Flashes the connected device with Jaguar.
- `jag.scan`: Scans for devices that haven been flashed with Jaguar.
- `jag.monitor`: Monitors the serial output of the connected device.
- `jag.run`: Runs a file on the device.
- `jag.watch`: Watches a file for changes and reruns it automatically on every change.

The extension is now set up and ready to use. Visit the [Toit docs](https://docs.toit.io/) for more information about Toit.
