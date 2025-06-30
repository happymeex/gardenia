# Contributing to Gardenia

Thank you for helping improve Gardenia!

## How to Contribute

- Be respectful and inclusive.
- Fork & clone the repo.
- Install dependencies: `npm install`
- Set up environment variables (see README.md).

### Branching
- `main`: production
- `develop`: integration
- Features: `feature/your-feature-name`
- Bug fixes: `fix/bug-description`

### Workflow
1. Create a branch:
   ```sh
   git checkout -b feature/your-feature-name
   ```
2. Make your changes (see Coding Standards below).
3. Run tests:
   ```sh
   npm test
   ```
4. Commit and push:
   ```sh
   git commit -m "Add: short description"
   git push origin feature/your-feature-name
   ```
5. Open a pull request to `develop`.

### Pull Requests
- Follow coding standards.
- Update docs if needed.
- Add tests for new features.
- Use clear PR titles & descriptions. Link relevant issues.
- Address code review feedback.

## Coding Standards
- Use TypeScript for client code.
- Declare types for all variables, parameters, and return values.
- Avoid `any`.
- Create interfaces/types as needed.
- Use JSDoc for public classes/methods.
- Naming:
  - PascalCase: classes
  - camelCase: variables, functions, methods
  - kebab-case: files, directories

- Follow the [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) for Go code.
- Use `gofmt` to format your Go code.
- Add comments for exported functions, types, and constants in Go.
- Write clear error messages in Go.

## Testing Guidelines

- Write unit tests for utility functions.
- Write integration tests for game mechanics.
- Test across different browsers.

- Write unit tests for API endpoints.
- Test database interactions.
- Test WebSocket functionality.

Thank you for contributing to Gardenia!
