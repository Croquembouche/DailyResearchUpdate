# Repository Guidelines

## Project Structure & Module Organization

This repository is currently minimal, with no committed source, test, or build manifest detected. Keep future additions organized and predictable:

- `src/` for application or library source code.
- `tests/` for automated tests that mirror `src/` module names.
- `assets/` for static files, templates, sample inputs, or generated examples that are intended to be versioned.
- `docs/` for design notes, operational runbooks, and contributor-facing documentation.

Avoid committing local caches, generated build outputs, credentials, or large transient data files unless they are explicitly required for reproducibility.

## Build, Test, and Development Commands

No project-specific build or test commands are defined yet. When adding a toolchain, document the canonical commands here and in the README. Recommended patterns:

- `npm install` / `npm test` for Node.js projects.
- `python -m venv .venv` and `pytest` for Python projects.
- `make test` or `make build` if a `Makefile` becomes the repo entry point.

Prefer one clear command per workflow so contributors do not need to infer the correct path.

## Coding Style & Naming Conventions

Use clear, descriptive names and keep modules focused on one responsibility. Suggested conventions:

- Directories and scripts: `kebab-case` or `snake_case`, used consistently.
- Python modules: `snake_case.py`; classes: `PascalCase`.
- JavaScript/TypeScript files: prefer `camelCase` or component-style `PascalCase` where appropriate.
- Markdown files: concise titles, sentence-case headings, and fenced code blocks with language labels.

If a formatter or linter is introduced, commit its configuration and make it runnable from the documented command set.

## Testing Guidelines

Add tests alongside any non-trivial source code. Mirror source names where practical, for example `src/parser.py` with `tests/test_parser.py` or `src/parser.ts` with `tests/parser.test.ts`.

Tests should cover normal behavior, edge cases, and failure paths. Keep sample fixtures small and place reusable fixtures under `tests/fixtures/`.

## Commit & Pull Request Guidelines

Current history only shows `Initial commit`, so no detailed commit convention is established. Use short, imperative commit messages such as `Add daily update parser` or `Document setup workflow`.

Pull requests should include:

- A brief summary of the change.
- The commands run to validate it, or `Not run` with a reason.
- Screenshots or sample output for user-facing changes.
- Linked issues or context when applicable.

## Agent-Specific Instructions

Before editing, inspect the relevant files once, make targeted changes, and avoid unrelated rewrites. Do not invent build commands or project structure; update this guide when the repository gains a real toolchain.
