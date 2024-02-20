# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.8] - 2024-02-20
### Changed
- More syntax highlighting improvements.

## [1.8.7] - 2024-02-15
### Changed
- Remove '-' as wordSeparator. This undoes part of the 1.8.3 release.
- Fix syntax highlighting for `foo-bar--` (an identifier containing a '-'
  followed by '--').

## [1.8.6] - 2023-11-02
### Changed
- Don't indent after empty lines.

## [1.8.5] - 2023-11-01
### Added
- Support for mixins.

## [1.8.4] - 2023-09-18
### Changed
- Fix word-boundary regular expressions.

## [1.8.3] - 2023-08-10
### Changed
- Improve "word" experience. VSCode and Toit don't completely agree on what a
  word-boundary is, and this change tries to improve the experience.

## [1.8.2] - 2023-08-09
### Changed
- Add auto-indent.

## [1.8.1] - 2023-08-09
### Changed
- Fix for constant syntax highlighting.

## [1.8.0] - 2023-08-09
### Added
- Support Kebab identifiers.

## [1.7.0] - 2023-05-19
### Changed
- Use unicode category to match letters in the syntax highlighting.

## [1.6.6] - 2022-10-21
### Changed
- Remove toit.io from vscode page.

## [1.6.5] - 2022-09-19
### Changed
- Don't fail on bad jag execution.

## [1.6.4] - 2022-07-27
### Changed
- Prefer Jaguar over Toit.

## [1.6.1] - 2022-06-23
### Changed
- Fixed race in the LSP server.

## [1.6.0] - 2022-02-14
### Removed
- Removed support for simulators.

## [1.5.0] - 2022-02-07
### Changed
- Fixed paths on Windows.

## [1.4.0] - 2022-01-03
### Added
- Jaguar commands (run, watch, scan, flash, and monitor).

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
