# Project Setup Skill Assets

This directory contains reusable templates and boilerplate files that can be copied into new projects.

## Contents

Currently empty - can be populated with:

- Framework-specific starter templates
- ESLint configuration presets
- GitHub Actions workflow templates
- Docker configuration templates
- CI/CD pipeline examples
- Database migration templates
- Test suite templates

## Usage Pattern

Assets in this directory are NOT loaded into context when the Agent reads the skill. Instead, they are referenced by scripts (like `init-project.ps1`) and copied or modified during project initialization.

This keeps the skill lightweight while providing comprehensive boilerplate options for different project types.

## Future Expansion

Suggested assets to add:

1. **nextjs-template/** - Complete Next.js starter with auth, database, API structure
2. **.github/workflows/** - Reusable GitHub Actions for different frameworks
3. **eslint-configs/** - Predefined ESLint configurations by framework
4. **docker/** - Docker and Docker Compose templates
5. **database-migrations/** - Migration templates for different ORMs
6. **testing-setup/** - Jest, Vitest, pytest templates
