# Framework Configuration References

This directory contains framework-specific configuration templates and patterns for project initialization.

## Contents

- `nextjs-config.md` - Next.js 15 specific configurations
- `typescript-config.md` - TypeScript standalone project setup
- `csharp-config.md` - C# (.NET) project setup
- `python-config.md` - Python project setup
- `tradingview-config.md` - TradingView script setup
- `rust-config.md` - Rust Cargo project setup
- `go-config.md` - Go module setup

## Usage

These files are referenced by the `init-project.ps1` script and contain:
- Framework-specific configuration file templates
- Default `.gitignore` patterns
- Environment variable templates
- Essential package/dependency information

The initialization script auto-generates these files in new projects based on the selected framework type.
