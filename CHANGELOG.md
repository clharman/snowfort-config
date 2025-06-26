# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI/CD pipeline with Node.js 18, 20, 22 support
- Security audit checks in CI pipeline
- Comprehensive CONTRIBUTING.md with development guidelines
- CODE_OF_CONDUCT.md following Contributor Covenant v2.1
- SECURITY.md with vulnerability reporting process
- This CHANGELOG.md for tracking version history
- GitHub issue templates (bug report, feature request, engine support)
- Pull request template with comprehensive checklists
- Repository badges for CI, npm, license, and tooling

## [0.0.9] - 2024-06-26

### Added
- Comprehensive cross-engine MCP server management
- Interactive MCP server management for Gemini CLI
- Automatic browser opening for web interface
- Web UI as default interface when no flags specified

### Changed
- Removed TUI (Terminal UI) to focus on web-only application
- Improved engine detection logging

### Fixed
- Engine detection and logging improvements

## [0.0.8] - 2024-XX-XX

### Added
- Initial release with basic configuration management
- Support for Claude CLI configuration (~/.claude.json)
- Support for Codex CLI configuration (~/.codex/config.json)
- Web interface for visual configuration editing
- File watching for real-time configuration updates
- Automatic backup system with timestamped backups
- JSON schema validation for configuration safety
- Command-line interface with multiple subcommands

### Features
- **Engine Adapters**: Pluggable system for supporting different AI CLI tools
- **Real-time Updates**: Server-Sent Events for live configuration monitoring
- **Safe Editing**: Atomic writes with automatic backup and rollback
- **Schema Validation**: Prevents invalid configuration states
- **Web Interface**: React SPA with Express backend
- **CLI Tools**: Binary executable for command-line usage

---

## Release Types

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

## Versioning

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality additions
- **PATCH** version for backward-compatible bug fixes

## Links

- [Repository](https://github.com/snowfort-ai/config)
- [Issues](https://github.com/snowfort-ai/config/issues)
- [Releases](https://github.com/snowfort-ai/config/releases)