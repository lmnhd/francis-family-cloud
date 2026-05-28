# Project Setup Skill - Usage Guide

This guide shows how to use the new `project-setup` skill to initialize projects across your workspace.

## Quick Start

### Step 1: Trigger the Skill

When creating a new project, ask:

> "Set up a new Next.js project called 'ContentRecommender' that uses PostgreSQL and integrates with OpenAI."

The Agent will recognize this as a `project-setup` task and follow the structured workflow.

### Step 2: Confirm Project Details

The Agent will ask for confirmation on:
- **Project Name**: ContentRecommender ✓
- **Framework/Type**: next-js ✓
- **Database**: PostgreSQL ✓
- **Description**: [Automatically generated or confirmed] ✓
- **Project Year**: 2026 (default) ✓

### Step 3: Project Initialization Runs

The Agent executes the PowerShell initialization script:

```powershell
.\init-project.ps1 -ProjectName "ContentRecommender" -ProjectType "next-js" `
  -ProjectYear 26 -Description "AI-powered article recommendation engine" `
  -DatabaseType "PostgreSQL"
```

**The script automatically:**
- 📋 **Integrates workspace standards** from `C:\Users\cclem\Dropbox\Source\.github\copilot-instructions.md`
- ✅ Copies critical TypeScript, PowerShell, and Git workflow rules
- 🎯 Customizes for framework-specific conventions (Next.js patterns, etc.)
- 📁 Populates platform directories (.cursor/rules/, CLAUDE.md) with content

### Step 4: Review Generated Structure

The project is created at: `Projects-26/ContentRecommender/`

```
ContentRecommender/
├── .github/
│   └── copilot-instructions.md    # Project rules (with inherited workspace standards)
├── app/
│   ├── api/
│   ├── (features)/
│   └── layout.tsx
├── src/
│   ├── lib/
│   │   ├── types/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── ai/                    # For OpenAI integration
│   ├── components/
│   ├── server/
│   └── storage/
├── public/
├── .env.local                     # Template for environment variables
├── .gitignore
├── .next.config.ts                # Framework config
├── tailwind.config.ts             # Styling config
├── tsconfig.json                  # TypeScript config
├── package.json                   # With Next.js 15 base deps
├── PDR.md                         # Project Design Record (template)
└── README.md                      # Developer guide

✅ Git repository initialized with "Initial project setup" commit
```

### Step 4.5: Validate Integration (Important!)

**Before handing off**, the Agent should verify workspace standards were properly integrated:

```powershell
# Verify copilot-instructions contains inherited standards
Get-Content .github/copilot-instructions.md | Select-String -Pattern "TypeScript Standards|PowerShell|Git Workflow"

# Check platform directories are populated
Test-Path .cursor/rules/critical.md  # Should exist with content
Test-Path CLAUDE.md                   # Should exist with content
```

**Expected output:**
- ✅ `.github/copilot-instructions.md` shows "TypeScript Standards", "PowerShell Syntax", "Git Workflow"
- ✅ `.cursor/rules/critical.md` exists and contains project guidance
- ✅ `CLAUDE.md` exists with references to master workspace rules

**If validation fails**, re-run the script or manually copy critical sections from `C:\Users\cclem\Dropbox\Source\.github\copilot-instructions.md`.

### Step 5: Hand Off to Development

Agent confirms to user:

> "Project 'ContentRecommender' is initialized and ready for development!
>
> **Next Steps:**
> 1. Navigate: `cd Projects-26/ContentRecommender/`
> 2. Install dependencies: `npm install`
> 3. Configure `.env.local` with your PostgreSQL connection and OpenAI API key
> 4. Review `PDR.md` for architecture placeholder
> 5. Review `.github/copilot-instructions.md` for development rules
> 6. Start dev: `npm run dev`
>
> The project is ready for feature development!"

---

## Supported Frameworks

| Framework | Type Flag | Primary Files | Language |
|-----------|-----------|---------------|----------|
| Next.js 15 | `next-js` | package.json, tsconfig.json, tailwind.config.ts | TypeScript |
| TypeScript | `typescript` | tsconfig.json, package.json | TypeScript |
| C# (.NET) | `c-sharp` | *.csproj, Program.cs | C# |
| Python | `python` | requirements.txt, pyproject.toml | Python |
| TradingView | `tradingview` | indicators/, strategies/ | Pine Script |
| Rust | `rust` | Cargo.toml | Rust |
| Go | `go` | go.mod | Go |
| Generic | `generic` | Minimal | Any |

---

## What Gets Created

### Always Created (All Projects)

✅ Project directory in `Projects-[year]/[ProjectName]/`  
✅ Git repository initialized  
✅ `.github/copilot-instructions.md` (copied from GENERIC_PROJECT_RULES.md)  
✅ `PDR.md` - Project Design Record with architecture placeholders  
✅ `README.md` - Developer guide  
✅ `.gitignore` - Framework-appropriate  
✅ `.env` files - Template with sample variables  
✅ Git checkpoint commit: "Initial project setup"  

### Framework-Specific (Next.js Example)

✅ `app/` - App Router directory structure  
✅ `src/` - Source code directories (lib, components, server, storage)  
✅ `public/` - Static assets directory  
✅ `package.json` - With Next.js 15 base dependencies  
✅ `tsconfig.json` - Strict TypeScript configuration  
✅ `tailwind.config.ts` - Tailwind CSS setup  
✅ `next.config.ts` - Next.js configuration  

### NOT Created (Left for Development Agent)

❌ Package installations (`npm install`, `pip install`, etc.)  
❌ Database setup or migrations  
❌ Feature implementations  
❌ Component development  
❌ API endpoints  
❌ Business logic  

---

## Generated Documentation Files

### PDR.md (Project Design Record)

Template with sections for:
- Project overview and problem statement
- Core objectives and feature list
- Technical stack (framework, database, services)
- Architecture diagrams (placeholder)
- Data models (placeholder)
- API structure (placeholder)
- Key milestones
- Known constraints
- Revision history

**What the development agent should do:**
> Update each "[To be determined by development agent]" section as you make architectural decisions.

### README.md (For New Developers)

Includes:
- Quick start setup instructions
- Project structure overview
- Key files explanation
- Development guidelines
- Git workflow conventions
- Testing instructions
- Technology stack summary
- Project status

---

## Command Examples

### Create a Next.js Project

```powershell
$ProjectPath = "C:\Users\cclem\Dropbox\Source"
cd $ProjectPath
.\\.github\skills\project-setup\scripts\init-project.ps1 `
  -ProjectName "BlogEngine" `
  -ProjectType "next-js" `
  -ProjectYear 26 `
  -Description "Modern blog platform with AI-powered recommendations" `
  -DatabaseType "PostgreSQL"
```

### Create a Python Project

```powershell
.\\.github\skills\project-setup\scripts\init-project.ps1 `
  -ProjectName "DataAnalyzer" `
  -ProjectType "python" `
  -ProjectYear 26 `
  -Description "Advanced data analysis and visualization tool" `
  -DatabaseType "SQLite"
```

### Create a C# Project

```powershell
.\\.github\skills\project-setup\scripts\init-project.ps1 `
  -ProjectName "TradeMonitor" `
  -ProjectType "c-sharp" `
  -ProjectYear 26 `
  -Description "Real-time trading monitor and alert system"
```

### Create a Generic Project

```powershell
.\\.github\skills\project-setup\scripts\init-project.ps1 `
  -ProjectName "ExperimentalFeature" `
  -ProjectType "generic" `
  -ProjectYear 26 `
  -Description "Experimental feature for testing new approaches"
```

---

## Integration with Project Planning Agent

**Recommended Workflow:**

1. **Project Planning Agent** creates detailed PDR.md with:
   - Architecture decisions
   - Feature specifications
   - Technical implementation details
   - Data model designs
   - API endpoint specifications

2. **Project Setup Skill** creates scaffolding with:
   - Framework boilerplate
   - Configuration files
   - Directory structure
   - Template PDR.md (replaced by Planning Agent's version)

3. **Development Agent** implements features:
   - Follows `.github/copilot-instructions.md`
   - References PDR.md for decisions
   - Creates features according to spec
   - Maintains code quality standards

---

## Key Principles

✅ **Fast Initialization** - Projects ready for development in seconds  
✅ **Consistent Structure** - All projects follow same patterns  
✅ **Framework-Aware** - Appropriate boilerplate for each framework  
✅ **Documentation-First** - PDR.md and README.md drive development  
✅ **Agent Rules** - `.github/copilot-instructions.md` ensures quality  
✅ **Git Ready** - Initial commit created automatically  

---

## Troubleshooting

### Script Not Found
**Issue**: `.\init-project.ps1: The term is not recognized`  
**Solution**: Run from correct directory, use full path, or dot-source: `. .\init-project.ps1`

### Git Not Initialized
**Issue**: "fatal: not a git repository"  
**Solution**: Script initializes git automatically. Check permissions if it fails.

### GENERIC_PROJECT_RULES.md Not Found
**Issue**: `.github/copilot-instructions.md` file created but empty  
**Solution**: Ensure GENERIC_PROJECT_RULES.md exists at `.github/GENERIC_PROJECT_RULES.md`

### Permission Denied
**Issue**: "Access denied" when creating directories  
**Solution**: Ensure write permissions to `Projects-[year]/` directory

---

## Next Steps

1. **For Users**: Call the skill with project details → Agent initializes project
2. **For Agents**: Use SKILL.md to understand workflow → Execute init-project.ps1 script
3. **For Development**: Read `.github/copilot-instructions.md` → Update PDR.md → Implement features

