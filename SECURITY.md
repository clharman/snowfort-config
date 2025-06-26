# Security Policy

## Supported Versions

We actively support the following versions of Snowfort Config:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Snowfort Config seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please do not open a public GitHub issue for security vulnerabilities. This helps protect users until a fix can be developed and deployed.

### 2. Report Privately

Please report security vulnerabilities by:

- **Email**: Send details to [security@snowfort.ai](mailto:security@snowfort.ai)
- **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature

### 3. Include These Details

When reporting a vulnerability, please include:

- **Description**: A clear description of the vulnerability
- **Impact**: What an attacker could potentially do
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Environment**: Operating system, Node.js version, package version
- **Proof of Concept**: If applicable, a minimal example demonstrating the issue

### 4. Response Timeline

We will respond to security reports according to this timeline:

- **Initial Response**: Within 48 hours
- **Status Update**: Weekly updates until resolved
- **Resolution**: We aim to resolve critical issues within 7 days
- **Public Disclosure**: After fix is deployed and users have time to update

## Security Considerations

### Configuration Files

Snowfort Config manages sensitive configuration files that may contain:

- API keys and tokens
- Personal preferences
- System paths

We implement the following protections:

- **File Permissions**: Respect existing file permissions
- **Backup Safety**: Backups are created with the same permissions as originals
- **No Logging**: Sensitive data is never logged
- **Schema Validation**: Input validation prevents injection attacks

### Network Operations

- **Local Only**: The web interface only binds to localhost by default
- **No External Requests**: No automatic phone-home or telemetry
- **CORS Protection**: API endpoints include appropriate CORS headers

### File System Operations

- **Path Validation**: All file paths are validated and sanitized
- **Atomic Writes**: Configuration updates are atomic to prevent corruption
- **Backup Recovery**: Failed operations can be automatically reverted

### Dependencies

- **Regular Audits**: Dependencies are regularly audited for vulnerabilities
- **Minimal Dependencies**: We keep the dependency tree as small as possible
- **Lock Files**: pnpm-lock.yaml ensures reproducible builds

## Best Practices for Users

### Secure Configuration

1. **File Permissions**: Ensure your configuration files have appropriate permissions (600 or 644)
2. **Backup Security**: Store backups securely, especially if they contain sensitive data
3. **Network Access**: Only expose the web interface on trusted networks
4. **Updates**: Keep Snowfort Config updated to the latest version

### Environment Security

1. **Node.js Version**: Use a supported version of Node.js (18+)
2. **System Updates**: Keep your operating system updated
3. **Access Control**: Limit who has access to configuration files

## Security Updates

Security updates will be:

- **Prioritized**: Released as soon as possible
- **Clearly Marked**: Tagged with security notices in release notes
- **Backward Compatible**: When possible, fixes will be backward compatible
- **Well Documented**: Include migration instructions if changes are required

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors who help improve our security will be acknowledged in:

- Release notes (unless they prefer to remain anonymous)
- Our security hall of fame
- CHANGELOG.md

## Contact

For security-related questions or concerns:

- **Email**: [security@snowfort.ai](mailto:security@snowfort.ai)
- **Issues**: For non-security bugs, use [GitHub Issues](https://github.com/snowfort-ai/config/issues)

Thank you for helping keep Snowfort Config secure!