# Toit for Visual Studio Code

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/toit.toit.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=toit.toit)

The Toit extension adds language support for the Toit programming language, including syntax highlighting, integrated static analysis, code completion, and device overview.

## Quick start

### toit.io
In this configuration the extension uses the `toit` CLI to connect to the Toit servers.

All of the extension's features are activated in this mode.

- _Step 1:_ Install [Toit](https://docs.toit.io/getstarted/installation) and the [Toit Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=toit.toit).
- _Step 2:_ Either place `toit` in your path or set `toit.Path` to the location of `toit`.
- _Step 3:_ The extension is activated when you open a `.toit` file.

The extension is now set up and ready to use. Visit the [Toit docs](https://docs.toit.io/) for more information about Toit.

### toitlang.org
The open source version of Toit provides syntax highlighting and the
language server (providing completions, diagnostics, ...).

- _Step 1:_ Follow the steps to build the tools as described in the [README](https://github.com/toitlang/toit).
- _Step 2:_ Either place `toitlsp` and `toitc` in your path or set `toitLanguageServer.command` to `["PATH_TO_TOITLSP", "--toitc=PATH_TO_TOITC"]`.
- _Step 3:_ The extension is activated when you open a `.toit` file.

## Extension tour

### See devices and applications

Get an overview of your devices and running apps in the Toit sidebar.

<p align=center>
<img src="images/readme/demo-device-view.gif" width=75%>
</p>

### Deploy and run apps

[Run and deploy](https://docs.toit.io/platform/deploy/runordeploy) the app you are developing from the device view or from the command palette.

<p align=center>
<img src="images/readme/demo-run.gif" width=75%>
<br />
<em>Run apps.</em>
</p>

<p align=center>
<img src="images/readme/demo-deploy.gif" width=75%>
<br />
<em>Deploy apps.</em>
</p>

### Provision and monitor

[Provision](https://docs.toit.io/platform/concepts/provision) new devices and monitor serial output from the command palette.

<p align=center>
<img src="images/readme/demo-provision.gif" width=75%>
<br />
<em>Provision device.</em>
</p>

<p align=center>
<img src="images/readme/demo-monitor.gif" width=75%>
<br />
<em>Monitor output.</em>
</p>

### Switch project

Switch between Toit projects from the status bar.

<p align=center>
<img src="images/readme/demo-org.gif" width=75%>
</p>

### Simulators

Start and stop simulators from the device view or the command palette.

<p align=center>
<img src="images/readme/demo-simulator.gif" width=75%>
</p>
