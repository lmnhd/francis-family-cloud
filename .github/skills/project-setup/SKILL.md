---
name: project-setup
description: Comprehensive project bootstrap skill for new repositories and source directories, including AI policy setup, thin framework wrappers, git initialization, and modern scaffolding for Next.js, TypeScript, C#, Python, TradingView, Rust, Go, and generic projects. Use when creating a new project, re-bootstraping an existing source directory, or wiring the repo-wide AI instruction files.
license: Complete terms in LICENSE.txt
---

# Project Setup Skill

Initialize new projects across different frameworks with professional scaffolding, repo policy files, git initialization, and ready-to-develop structure.

## When to Use This Skill

Trigger this skill when:
- Creating a new project in Projects-24/, Projects-25/, or Projects-26/
- User provides project name, type (framework), and optionally a brief description
- Need to scaffold boilerplate before handing off to development agent
- Need to create or refresh AI policy files such as `AI_POLICY.md`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/critical.md`, or `.windsurf/rules.md`
- Framework type is one of: Next.js, TypeScript, C#, Python, TradingView, Rust, Go, or unspecified (generic)

**Do NOT use this skill to:** Modify existing projects, create features, or install npm packages (leave that for the development agent).

---

## Core Workflow

### Phase 1: Gather Project Information

Ask user for:

1. **Project Name** (required) - Clear, descriptive name (e.g., "AI Coach Bot", "Portfolio Dashboard")
2. **Project Type/Framework** (required) - One of: `next-js`, `typescript`, `c-sharp`, `python`, `tradingview`, `rust`, `go`, or `generic`
3. **Project Year Directory** (optional) - Default to current year (2026 → `Projects-26`)
4. **Brief Description** (optional) - 1-2 sentence summary of what the project does
5. **Database Type** (optional) - If applicable: PostgreSQL, DynamoDB, SQLite, MongoDB, etc.
6. **Additional Services** (optional) - AI/LLM services, external APIs, auth systems

**Stop here if user hesitates on any required field—do NOT assume.**

### Phase 1.5: Integrate AI Policy and Workspace Standards

### Phase 1.5: Template Structure Overview

**CRITICAL**: The init-project.ps1 script automatically copies a complete `.github/` template structure from the `copilot_setup/` directory and then aligns the repo with any local `AI_POLICY.md` file. This template includes:

- **copilot-instructions.md** - Pre-configured with universal coding standards and platform rules
- **agents/** - Three-agent orchestration system (Plan/Execute/Verify)
- **prompts/** - Reusable prompt templates for common tasks
- **skills/** - Embedded skill library (brand-identity, frontend-design)

The script will:
1. Copy the entire template structure
2. Automatically customize `copilot-instructions.md` with project-specific details
3. Replace placeholders: project name, type, description, database, services
4. Configure project year paths
5. Apply framework-specific rules
6. Create or refresh `AI_POLICY.md` when the source directory uses repo-wide AI policy files
7. Keep thin wrappers pointed at `AI_POLICY.md` and avoid duplicating policy content
8. Copy the `.github/skills/` directory into the new project and scrub secret-bearing env values before finalizing the copy

**No manual configuration needed** - the template is production-ready from git init.

### Phase 2: Initialize Git Repository

Using the PowerShell script (located at `C:\Users\cclem\Dropbox\Source\.github\scripts\init-project.ps1`):

```powershell
# Navigate to script directory
cd C:\Users\cclem\Dropbox\Source\.github\scripts

# Run initialization script
.\init-project.ps1 -ProjectName "MyProject" -ProjectType "next-js" -ProjectYear 26 -Description "Brief description"

# Optional parameters:
# -Database "postgresql"
# -Services "openai,anthropic,stripe"
```

The script will:
1. Create parent directory in `Projects-[year]/[ProjectName]/`
2. Initialize git repository
3. Create AI tool rules directories (`.cursor/rules/`, `.windsurf/rules/`, `.agent/rules/`)
4. Generate AI tool rules files (`CLAUDE.md`, `.cursor/rules/critical.md`, `.windsurf/rules/critical.md`, `.agent/rules/critical.md`)
5. Create base directory structure (scaffolding)
6. Generate configuration files based on project type
7. Create `.github/copilot-instructions.md` from GENERIC_PROJECT_RULES.md or align it to the repo policy wrapper flow
8. Generate PDR.md (Project Design Record) template
9. Create README.md for new developers
10. Initialize `.gitignore` appropriate to framework
11. Copy starter `.env.local` file from `env.local.start` template to project root
11. **Copy complete `.github/` template structure from `copilot_setup/` directory**

**Do NOT run npm install, pip install, or any package manager commands yet.**

### Phase 2.5: Copy Copilot Setup Template (All-in-One)

The script automatically copies the complete `copilot_setup/.github/` directory structure to every new project, providing a comprehensive foundation for AI-assisted development:

**Source:** `C:\Users\cclem\Dropbox\Source\.github\skills\project-setup\copilot_setup\.github\`

**What's Included:**

1. **`copilot-instructions.md`** - Project-specific AI agent instructions (auto-customized with project details)
   - Inherits universal coding standards from Master Workspace
   - Pre-configured with platform rules (no dev server starts, PowerShell syntax, git checkpoints)
   - Framework-specific guidelines
   - Project metadata (name, type, description, database, services)

2. **`agents/` - Three-agent orchestration system**
   - `Plan Delegator.agent.md` - Breaks complex work into phases, stops for user approval
   - `Execute Phase.agent.md` - Executes tasks from current-phase.md with strict instructions
   - `Verify Phase.agent.md` - Validates phase completion with evidence-based checks

3. **`prompts/` - Reusable prompt templates**
   - `create_project_readme.prompt.md` - Generate comprehensive project documentation
   - `remember.prompt.md` - Context retention across sessions
   - `update_pdr.prompt.md` - Maintain Project Design Record

4. **`skills/` - Embedded skill library**
   - `brand-identity/` - Complete design system with tokens, style guides, voice/tone
   - `frontend-design/` - UI component patterns and design guidelines
   - Copy this directory into the new project and remove any populated API key values before handing it off

**Customization:** The script automatically updates `copilot-instructions.md` with:
- Project name, type, and description
- Database type and services
- Project year for file paths
- Framework-specific rules

**Why?** This provides:
- **Instant AI agent readiness** with pre-configured instructions
- **Consistent orchestration patterns** for complex multi-phase work
- **Unified brand identity** across all projects
- **Reusable prompts** for common tasks
- **Zero manual setup** - everything is ready from git init
- **Professional brand consistency** in design, voice, and technology decisions

The script handles this automatically—no manual copying needed.

### Phase 2.6: Environment Configuration

The script automatically copies a starter `.env.local` file to the project root:

**Source File:** `C:\Users\cclem\Dropbox\Source\.github\skills\project-setup\copilot_setup\env.local.start`

**Destination:** `[Project Root]/.env.local`

**Contents:**
- `OPENAI_API_KEY` - Pre-populated OpenAI API key for development
- `ANTHROPIC_API_KEY` - Pre-populated Anthropic API key for development  
- `GOOGLE_API_KEY` - Pre-populated Google API key for development

**Important Notes:**
- ⚠️ **These are starter/development keys** - Replace with production keys before deployment
- ⚠️ **Never commit `.env.local` to git** - `.gitignore` is pre-configured to exclude this file
- ✅ **Ready to develop immediately** - Keys are pre-loaded so you can test API integrations without configuration
- ⚠️ **Keep keys secure** - These are shared development keys; use personal keys for sensitive work
- ⚠️ **When copying `.github/skills/` into new projects, redact any environment values that appear in skill notes or templates**

**When to update:**
1. After cloning, check that `.env.local` exists in project root
2. For production deployments, replace with actual API credentials
3. For team development, coordinate with team about shared development credentials

### Phase 3: Scaffolding by Framework Type

The script generates framework-specific scaffolding:

#### Next.js Scaffolding
```
project/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/
│   │   ├── Plan Delegator.agent.md
│   │   ├── Execute Phase.agent.md
│   │   └── Verify Phase.agent.md
│   └── .plan-delegator/
│       └── (created during execution)
├── skills/
│   └── brand-identity/
│       ├── SKILL.md
│       └── resources/
│           ├── design-tokens.json
│           ├── tech-stack.md
│           ├── ui-style-guide.md
│           └── voice-tone.md
├── app/
│   ├── api/
│   ├── (features)/
│   └── layout.tsx
├── src/
│   ├── lib/
│   │   ├── types/
│   │   ├── hooks/
│   │   └── utils/
│   ├── components/
│   ├── server/
│   └── storage/
├── public/
├── .env.local (pre-populated with starter API keys)
├── .gitignore
├── .next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json (with Next.js 15 base deps)
├── PDR.md
└── README.md
```

#### TypeScript (Standalone) Scaffolding
```
project/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   └── index.ts
├── dist/
├── .env
├── .gitignore
├── tsconfig.json
├── package.json (with TypeScript base setup)
├── PDR.md
└── README.md
```

#### C# (.NET) Scaffolding
```
project/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── Project.csproj
│   ├── Program.cs
│   ├── Models/
│   ├── Services/
│   └── Utils/
├── tests/
├── .gitignore
├── .env
├── PDR.md
└── README.md
```

#### Python Scaffolding
```
project/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── main.py
│   ├── lib/
│   ├── models/
│   └── utils/
├── tests/
├── .env
├── .gitignore
├── requirements.txt (base)
├── pyproject.toml (if Poetry)
├── PDR.md
└── README.md
```

#### TradingView Scaffolding
```
project/
├── .github/
│   └── copilot-instructions.md
├── indicators/
├── strategies/
├── libraries/
├── data/
├── .env
├── .gitignore
├── PDR.md
└── README.md
```

#### Generic (Unspecified) Scaffolding
```
project/
├── .github/
│   └── copilot-instructions.md
├── src/
├── docs/
├── .env
├── .gitignore
├── PDR.md
└── README.md
```

### Phase 4: Generate Documentation Files

#### .github/copilot-instructions.md
- Copy contents of `GENERIC_PROJECT_RULES.md`
- Customize framework-specific sections (e.g., "Framework: Next.js 15" for Next.js projects)
- Include link to PDR.md and project README

#### PDR.md (Project Design Record)
Template structure:
```markdown
# Project Design Record

## 1. Project Overview
[From user description or "To be determined by Project Planning Agent"]

## 2. Core Objectives
- [Objective 1]
- [Objective 2]
- [Objective 3]

## 3. Technical Stack
- Framework: [Framework]
- Language: [Language]
- Database: [Database or "TBD"]
- Key Services: [Services or "TBD"]

## 4. Architecture (Placeholder)
[To be filled by development agent]

## 5. Data Models (Placeholder)
[To be filled by development agent]

## 6. API Structure (Placeholder for Next.js/API projects)
[To be filled by development agent]

## 7. Key Milestones
- [ ] Project initialization and setup
- [ ] Core architecture implementation
- [ ] Initial feature development
- [ ] Testing and refinement
- [ ] Deployment preparation

## 8. Known Constraints & Considerations
- [Any known constraints]

## 9. Next Steps
1. Development agent assumes the project
2. Update PDR.md with final architectural decisions
3. Begin feature implementation
```

#### README.md (For New Developers)
```markdown
# [Project Name]

[1-sentence description]

## Quick Start

### Prerequisites
- [Framework-specific requirements]
- Node.js 18+ (if applicable)
- [Other requirements]

### Setup
1. Clone the repository
2. Install dependencies: `npm install` (or equivalent)
3. Configure environment: Copy `.env.example` to `.env.local`
4. Start development: `npm run dev` (or equivalent)

## Project Structure

[Framework-specific structure overview]

## Key Files
- `.github/copilot-instructions.md` - Agent development rules and conventions
- `CLAUDE.md` - Agent guidance for Claude Code and direct Claude usage
- `.cursor/rules/critical.md` - Rules for Cursor IDE
- `.windsurf/rules/critical.md` - Rules for Windsurf IDE
- `.agent/rules/critical.md` - Rules for generic AI agents
- `PDR.md` - Project Design Record (architecture, design decisions)

## Development Guidelines
- Follow rules in `.github/copilot-instructions.md`
- Check PDR.md for architectural patterns
- Create test pages in `/tests/` directory (if applicable)
- Use `git checkpoint: before [change]` before major changes

## Technologies
- Framework: [Framework]
- Language: [Language]
- Database: [Database or TBD]

## Getting Help
1. Read `.github/copilot-instructions.md` for agent rules
2. Check PDR.md for architecture decisions
3. Review project-specific notes in comments

---

**Created**: [Date]  
**Project Type**: [Framework]  
**Status**: Initialization complete, ready for development
```

---

## Implementation Details

### PowerShell Script Location

The script is located at:
```
C:\Users\cclem\Dropbox\Source\.github\scripts\init-project.ps1
```

The core script handles:
- Directory creation and git initialization
- Framework-specific configuration file generation
- Copying and customizing `.github/copilot-instructions.md`
- Creating PDR.md and README.md templates
- Setting up `.gitignore` for framework type

**Script is fully implemented and tested** - see `C:\Users\cclem\Dropbox\Source\.github\scripts\init-project.ps1` for complete code.

### Template Files

All template files are stored in `C:\Users\cclem\Dropbox\Source\.github\templates/`:

- **`GENERIC_PROJECT_RULES.md`** - Master template for `.github/copilot-instructions.md`
- **`rules/CLAUDE_TEMPLATE.md`** - Template for `CLAUDE.md`
- **`rules/CURSOR_TEMPLATE.md`** - Template for `.cursor/rules/critical.md`
- **`rules/WINDSURF_TEMPLATE.md`** - Template for `.windsurf/rules/critical.md`
- **`rules/AGENT_TEMPLATE.md`** - Template for `.agent/rules/critical.md`

These templates use placeholder variables like `{{PROJECT_NAME}}`, `{{PROJECT_TYPE}}`, `{{DESCRIPTION}}` that are replaced during project initialization.

### Framework Configuration Templates

Framework-specific configurations (package.json, tsconfig.json, etc.) are generated inline by the PowerShell script.
See the script source for complete configuration templates for each framework type.

### Phase 5: Validate Integration

**Before marking complete**, verify:

```powershell
# Check copilot-instructions contains workspace standards
Get-Content .github/copilot-instructions.md | Select-String -Pattern "TypeScript Standards|PowerShell|Git Workflow"

# Verify platform directories are populated
Test-Path .cursor/rules/critical.md
Test-Path CLAUDE.md
```

**Required validations:**
- [ ] `.github/copilot-instructions.md` contains TypeScript/PowerShell/Git rules from workspace
- [ ] `.cursor/rules/critical.md` exists and has content (not just a placeholder)
- [ ] `CLAUDE.md` exists with project-specific guidance
- [ ] Job search context referenced if project is portfolio/interview-relevant
- [ ] PDR.md template created and ready for planning agent

**If any validation fails**, re-run the integration steps or manually copy from master workspace files.

---

## After Initialization

**What IS complete:**
✅ Project directory structure  
✅ Git repository initialized  
✅ AI tool rules files created for Cursor, Windsurf, Claude Code, and generic agents
✅ Configuration files scaffolded  
✅ `.github/copilot-instructions.md` in place  
✅ `CLAUDE.md`, `.cursor/rules/critical.md`, `.windsurf/rules/critical.md`, `.agent/rules/critical.md` created  
✅ `AI_POLICY.md` created or aligned when the project uses repo-wide policy files
✅ PDR.md template ready for design decisions  
✅ README.md for new developers  

**What IS NOT complete (left for development agent):**
❌ Package installation (`npm install`, `pip install`, etc.)  
❌ Feature development  
❌ Database setup  
❌ API endpoint implementation  
❌ Component development  

---

## Usage Example

**User Request:**
> "Set up a new Next.js project called 'ContentRecommender' that recommends articles based on user preferences. It needs PostgreSQL and OpenAI integration."

**Agent Steps:**

1. **Confirm details:**
   - Project Name: ContentRecommender ✓
   - Framework: Next.js ✓
   - Database: PostgreSQL ✓
   - Services: OpenAI ✓
   - Year: 2026 (default) ✓

2. **Run initialization:**
   ```powershell
   cd C:\Users\cclem\Dropbox\Source\.github\scripts
   .\init-project.ps1 -ProjectName "ContentRecommender" -ProjectType "next-js" `
     -ProjectYear 26 -Description "Article recommendation engine with user preference learning" `
     -Database "postgresql" -Services "openai"
   ```

3. **Script creates:**
   - `Projects-26/ContentRecommender/` directory structure
   - Git repository initialized
   - `.github/copilot-instructions.md` with Next.js customizations
   - PDR.md with placeholder for architecture
   - README.md with setup instructions
   - `package.json` with Next.js 15 base dependencies
   - `tsconfig.json`, `tailwind.config.ts`, `.env.local` templates

4. **Hand off to development agent:**
   > "Project 'ContentRecommender' is initialized. Navigate to `Projects-26/ContentRecommender/` and begin implementing according to PDR.md. Remember: run `npm install` before `npm run dev`."

---

## Important Notes

- **Windows PowerShell only** - Use native PowerShell cmdlets, no Unix commands
- **No package installation** - Script scaffolds but doesn't install. Development agent runs `npm install`, `pip install`, etc.
- **GENERIC_PROJECT_RULES.md is master** - Always copy from this file for `.github/copilot-instructions.md`
- **Customize PDR.md later** - Template is placeholder; development agent fills in architecture details
- **Git checkpoint included** - First commit is "Initial project setup"

---

## Supported Frameworks

| Framework | Key Files | Package Manager | Notes |
|-----------|-----------|-----------------|-------|
| Next.js 15 | package.json, tsconfig.json, tailwind.config.ts, next.config.ts | npm/pnpm | Full App Router structure |
| TypeScript | tsconfig.json, package.json | npm/pnpm | Standalone TS project |
| C# (.NET) | *.csproj, Program.cs | dotnet | MSBuild projects |
| Python | requirements.txt, pyproject.toml | pip/poetry | Virtual env ready |
| TradingView | .chartID files | N/A | Pine script project |
| Rust | Cargo.toml | cargo | Full Cargo structure |
| Go | go.mod, go.sum | go | Module-based structure |
| Generic | Minimal | N/A | Bare structure, framework-agnostic |

---

## Related Skills & Documents

- `GENERIC_PROJECT_RULES.md` - Master rules file (copied into new projects)
- `codepilot-instructions.md` (in master workspace) - Overall workspace guidelines
- Project Planning Agent - Recommended for creating detailed PDR.md specifications

