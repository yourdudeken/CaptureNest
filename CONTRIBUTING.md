# Contributing to CaptureNest

Thank you for your interest in contributing! CaptureNest is an open-source project and we welcome all kinds of contributions — bug fixes, new features, documentation improvements, and more.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/CaptureNest.git
   cd CaptureNest
   ```
3. **Install dependencies**: `npm install`
4. **Create a branch**: `git checkout -b feature/my-feature`
5. **Make changes**, following the standards below
6. **Test** your changes
7. **Commit** with a clear message: `git commit -m 'feat: add motion detection triggers'`
8. **Push** and open a Pull Request

## Code Standards

- **TypeScript** everywhere — no plain JS in the server
- **ESLint + Prettier** formatting (run `npm run lint` before committing)
- Write modular, single-responsibility functions
- Use descriptive variable names — no abbreviations unless conventional
- Add JSDoc comments to exported functions
- Environment variables are always optional with sensible defaults

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short description

feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code restructuring, no feature change
test:     adding or updating tests
chore:    tooling, config, dependency updates
```

## Pull Request Guidelines

- One PR per feature/fix
- Include a clear description of what changed and why
- Reference any related issues
- Ensure `docker compose up --build` still works
- Add your feature to the README if user-facing

## Reporting Bugs

Open a GitHub Issue with:

- A clear title
- Steps to reproduce
- Expected vs actual behaviour
- Your OS, Node version, and Docker version
- Relevant logs (redact any personal data)

## Feature Requests

Open a GitHub Issue tagged `enhancement`. Describe the use case, not just the solution.

## Project Structure

See [README.md → Project Structure](README.md) for a full breakdown of where things live.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
