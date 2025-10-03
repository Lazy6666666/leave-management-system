# Contributing to Leave Management System

Thank you for your interest in contributing! We welcome all contributions, whether they're bug reports, feature requests, documentation improvements, or code contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [License](#license)

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/leave-management-system.git
   cd leave-management-system
   ```
3. Install dependencies:
   ```bash
   npm install
   cd backend
   npm install
   ```
4. Set up the environment as described in [ENVIRONMENT.md](docs/ENVIRONMENT.md)

## Development Workflow

1. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/description-of-fix
   ```

2. Make your changes following the code style guidelines

3. Run tests:
   ```bash
   npm test
   npm run test:coverage
   ```

4. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new leave type validation"
   ```

5. Push to your fork:
   ```bash
   git push origin your-branch-name
   ```

6. Open a pull request against the `main` branch

## Code Style

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use TypeScript for all new code
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Keep functions small and focused on a single responsibility
- Write tests for new features and bug fixes

### TypeScript Guidelines

- Use TypeScript interfaces for public API definitions
- Use types for internal type definitions
- Avoid `any` type - use proper types or `unknown`
- Use `readonly` for immutable properties

## Pull Request Process

1. Ensure all tests pass
2. Update documentation as needed
3. Ensure your code is properly formatted:
   ```bash
   npm run format
   ```
4. Run linter:
   ```bash
   npm run lint
   ```
5. Ensure test coverage meets our standards (minimum 80%)
6. Request review from at least one maintainer

## Reporting Bugs

Please use GitHub Issues to report bugs. Include the following information:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser/OS version if relevant

## Feature Requests

We welcome feature requests! Please open an issue with:

1. A clear, descriptive title
2. A description of the problem you're trying to solve
3. Proposed solution (if you have one)
4. Any alternative solutions you've considered

## License

By contributing, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE) file.
