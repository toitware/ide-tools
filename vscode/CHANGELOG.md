# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.9] - 2021-12-20
### Changed
- Fixed tool detection (toit, jag, toitc, toitlsp).

## [1.3.8] - 2021-12-20
### Changed
- Added support for letting [Jaguar](https://github.com/toitlang/jaguar) provide the LSP server.

## [1.3.7] - 2021-12-02
### Changed
- Removed deprecated configuration options.
- Renamed `toit.Path` configuration to `toit.path`.
- Added `toitLanguageServer.command` configuration.

## [1.3.5] - 2021-11-01
### Changed
- Renamed organization to project in README.

## [1.3.4] - 2021-10-21
### Changed
- Corrected link in README regarding new Toit Documentation pages.

## [1.3.3] - 2021-10-19
### Fixed
- Path selection for run and deploy on Windows.

## [1.3.2] - 2021-09-07
### Fixed
- Replaced broken link in README.
- Compatibility issue with CLI v1.8.0.

## [1.3.1] - 2021-09-02
### Fixed
- Compatibility issue with CLI v1.8.0.

## [1.3.0] - 2021-08-30
### Changed
- Cache serial info to keep the name displayed during monitoring.
- Deploy and run now prompts for a file if the current active file is incompatible with the action.

### Fixed
- Corrected port for provision button.

## [1.2.0] - 2021-08-20
### Added
- Device logs command and button in the device view.
### Changed
- Deploy and run now opens a per device output instead of complete logs view.

## [1.1.0] - 2021-06-25
### Added
- Device view with run and deploy buttons.
- Start simulator button in the device view.
- Stop simulator button in for every simulated device in the device view.
- Serial view with monitor and provision button for each serial port.
- Jump to device from serial view.
- Status bar with active organization and firmware version.
- Change organization from the status bar.

## [1.0.0] - 2021-04-09
### Added
- Release of 1.0.0.
- LSP client.
- Syntax highlighting.
