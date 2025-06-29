# Contributing to Snowfort Config

Thank you for your interest in contributing to Snowfort Config! We welcome contributions from the community and are grateful for your support.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (required for package management)

### Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/config.git
   cd config
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the project:
   ```bash
   pnpm build
   ```

4. Start the development server:
   ```bash
   ./scripts/start.sh
   ./scripts/status.sh  # Verify it started
   ```

5. Run tests:
   ```bash
   pnpm test
   ```

## Development Workflow

### Code Style and Quality

- **Linting**: Run `pnpm lint` before committing
- **Type Checking**: Run `pnpm typecheck` to verify TypeScript
- **Testing**: Add tests for new features and run `pnpm test`
- **Build**: Verify `pnpm build` succeeds

### Architecture Guidelines

- **Engine Adapters**: New AI CLI support goes in `packages/core/src/adapters/`
- **Web Components**: React components in `apps/web/src/components/`
- **API Routes**: Express routes in `apps/web/src/server/`
- **Schemas**: JSON schemas for validation in adapter files

### Adding New Engine Support

1. Create adapter class extending `BaseAdapter`
2. Implement required methods: `detect()`, `read()`, `validate()`, `write()`, `getConfigPath()`
3. Add JSON schema validation
4. Register adapter in `CoreService.registerAdapters()`
5. Add tests and documentation

## Contribution Guidelines

### Before You Start

- Check existing [issues](https://github.com/snowfort-ai/config/issues) and [PRs](https://github.com/snowfort-ai/config/pulls)
- For large changes, open an issue first to discuss the approach
- Make sure you understand the project's architecture (see CLAUDE.md)

### Pull Request Process

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**:
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**:
   ```bash
   pnpm lint
   pnpm typecheck  
   pnpm test
   pnpm build
   ```

4. **Commit with Clear Messages**:
   ```bash
   git commit -m "feat: add support for new AI CLI"
   git commit -m "fix: resolve configuration loading issue"
   git commit -m "docs: update installation instructions"
   ```

5. **Push and Create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### PR Requirements

- ✅ All CI checks must pass
- ✅ Include tests for new functionality
- ✅ Update documentation as needed
- ✅ Follow semantic commit message format
- ✅ Link to related issues

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` code style changes (formatting, etc.)
- `refactor:` code refactoring
- `test:` adding or updating tests
- `chore:` maintenance tasks

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, package version
- **Steps to Reproduce**: Clear, minimal reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Error Messages**: Full error output if applicable
- **Configuration**: Relevant config files (sanitized)

### Feature Requests

When requesting features:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions you've considered
- **Implementation**: Ideas for how to implement it

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Security

For security-related issues, please see our [Security Policy](SECURITY.md).

## Development Tips

### Web Development Pattern

This project uses a **build-first development workflow**:

1. Build frontend with `pnpm build`
2. Express serves built React SPA + API endpoints
3. Everything runs on single port (4040)
4. Use `./scripts/` commands for development

### Common Pitfalls

- ❌ Don't assume hot-reload development workflow
- ❌ Don't add proxy configurations to vite.config.ts  
- ✅ Use `./scripts/start.sh` for automation (exits immediately)
- ✅ Always build first, then run integrated server
- ✅ Use `./scripts/start.sh` for automation

### Testing Configuration Changes

1. Test with real config files in `~/.claude.json`, etc.
2. Verify file watching works by editing configs while app runs
3. Test backup creation and restoration
4. Verify schema validation with invalid JSON

## Development & Release Workflow

### Branch Strategy

We use **GitHub Flow** - a simple, effective strategy:

```
main (protected) ← All releases come from here
 ↑
feature branches ← All development happens here
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes  
- `docs/` - Documentation only
- `refactor/` - Code cleanup
- `chore/` - Dependencies, tooling

### Development Process

#### 1. Starting New Work

```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-cursor-cli-support
```

#### 2. Development & Testing

```bash
# Test before committing
pnpm lint          # Fix any linting issues
pnpm typecheck     # Fix any TypeScript errors
pnpm test          # Ensure tests pass
pnpm build         # Ensure build succeeds

# Test CLI functionality
node bin/snowfort-config.js --help
./scripts/start.sh && ./scripts/status.sh

# Commit with conventional format
git commit -m "feat: add support for Cursor CLI configuration"
```

#### 3. Create Pull Request

```bash
# Push feature branch
git push origin feature/add-cursor-cli-support

# Create PR
gh pr create --title "Add support for Cursor CLI" --body "..."
```

### Release Process

#### Version Types (Semantic Versioning)

```bash
# Patch (0.0.9 → 0.0.10) - Bug fixes, small improvements
npm version patch

# Minor (0.0.9 → 0.1.0) - New features, engine support  
npm version minor

# Major (0.0.9 → 1.0.0) - Breaking changes
npm version major
```

#### Complete Release Steps

```bash
# 1. Prepare release
git checkout main && git pull origin main
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# 2. Update CHANGELOG.md (move [Unreleased] items to new version)

# 3. Version bump and tag
npm version patch -m "Release v%s"

# 4. Deploy (triggers automatic npm publish + GitHub release)
git push origin main --tags
```

### Daily Commands Reference

```bash
# Development
git checkout main && git pull && git checkout -b feature/my-feature
pnpm lint && pnpm typecheck && pnpm test
./scripts/start.sh && ./scripts/status.sh && ./scripts/stop.sh

# Release
npm version patch && git push origin main --tags

# Troubleshooting
gh run list          # Check CI status
gh release list      # Check releases
pnpm clean && pnpm install && pnpm build  # Clean slate
```

### Repository Settings

- **Branch protection** on `main` requires PR reviews and passing CI
- **NPM_TOKEN** secret enables automatic npm publishing
- All commits to `main` trigger CI pipeline

## Getting Help

- **Documentation**: Check README.md and CLAUDE.md
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

Thank you for contributing! 🎉