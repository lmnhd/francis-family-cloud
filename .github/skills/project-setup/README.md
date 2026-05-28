# Project Setup Skill

Initialize new projects with professional scaffolding, git initialization, and ready-to-develop structure across multiple frameworks.

## 📋 Quick Overview

**Skill Name**: `project-setup`  
**Purpose**: Set up new projects in Projects-24/, Projects-25/, or Projects-26/ with proper structure  
**Supported Frameworks**: Next.js, TypeScript, C#, Python, TradingView, Rust, Go, Generic  
**Execution Method**: PowerShell script (`init-project.ps1`)  

---

## 🎯 What This Skill Does

When triggered, the `project-setup` skill:

1. **Gathers project information** from user (name, framework type, database, description)
2. **Creates project directory** in `Projects-[year]/[ProjectName]/`
3. **Initializes git repository** with first commit
4. **Scaffolds framework-specific structure** (app/, src/, config files)
5. **Generates documentation**:
   - `.github/copilot-instructions.md` (from GENERIC_PROJECT_RULES.md)
   - `PDR.md` - Project Design Record with architecture templates
   - `README.md` - Developer quick-start guide
6. **Creates configuration files** (package.json, tsconfig.json, .env, etc.)
7. **Hands off to development agent** ready for feature implementation

**What it does NOT do**:
- Install packages (`npm install`, `pip install`, etc.)
- Create features or business logic
- Set up databases or external services

---

## 📁 Skill Structure

```
project-setup/
├── SKILL.md                    # Main skill definition (Agent reads this)
├── USAGE_GUIDE.md              # User documentation with examples
├── SKILL_STRUCTURE.md          # Technical skill architecture
├── README.md                   # This file
│
├── scripts/
│   └── init-project.ps1        # PowerShell initialization script
│
├── references/
│   ├── README.md
│   └── nextjs-config.md        # Next.js 15 configuration reference
│
└── assets/
    └── README.md               # (Placeholder for future templates)
```

### File Purposes

| File | Purpose | Loaded |
|------|---------|--------|
| SKILL.md | Main skill definition for Agent | Always (metadata) + When triggered (full) |
| USAGE_GUIDE.md | Human-readable usage examples | No (reference only) |
| SKILL_STRUCTURE.md | Technical documentation | No (reference only) |
| init-project.ps1 | Executable initialization script | Only when Agent executes it |
| references/ | Framework-specific config details | Only when Agent needs them |
| assets/ | Boilerplate templates (planned) | Via script, not context |

---

## 🚀 Quick Start

### For Users
Ask the Agent to set up a project:

> "Set up a new Next.js project called 'BlogPlatform' for Projects-26, with PostgreSQL database."

Agent will:
1. Confirm project details
2. Execute initialization
3. Report completed project

### For Agents
When triggered with project setup request:

1. **Read SKILL.md** to understand workflow
2. **Confirm user requirements** (project name, framework, database, etc.)
3. **Execute initialization script**:
   ```powershell
   .\scripts\init-project.ps1 -ProjectName "BlogPlatform" -ProjectType "next-js" `
     -ProjectYear 26 -DatabaseType "PostgreSQL"
   ```
4. **Verify results** in `Projects-26/BlogPlatform/`
5. **Hand off to development agent**

---

## 🎨 Supported Frameworks

| Framework | Type Flag | Output | Config Files |
|-----------|-----------|--------|--------------|
| **Next.js 15** | `next-js` | App Router structure | package.json, tsconfig.json, tailwind.config.ts, next.config.ts |
| **TypeScript** | `typescript` | Standalone TS project | package.json, tsconfig.json, src/ structure |
| **C# (.NET)** | `c-sharp` | .NET project structure | *.csproj, Program.cs |
| **Python** | `python` | Python package structure | requirements.txt, pyproject.toml, src/ |
| **TradingView** | `tradingview` | TradingView structure | indicators/, strategies/, libraries/ |
| **Rust** | `rust` | Cargo project | Cargo.toml, src/main.rs |
| **Go** | `go` | Go module project | go.mod, cmd/, internal/, pkg/ |
| **Generic** | `generic` | Minimal structure | src/, docs/ |

---

## ✨ What Gets Created

### Always Created (All Frameworks)

✅ `.github/copilot-instructions.md` - Project development rules  
✅ `PDR.md` - Project Design Record (architecture template)  
✅ `README.md` - Developer quick-start guide  
✅ `.gitignore` - Framework-appropriate patterns  
✅ `.env` or `.env.local` - Environment variable templates  
✅ `git init` - Repository initialized  
✅ Initial commit - "Initial project setup"  

### Framework-Specific (Next.js Example)

✅ `app/` - Next.js App Router directories  
✅ `src/` - Source code (lib, components, server, storage)  
✅ `public/` - Static assets  
✅ `package.json` - Next.js 15 base dependencies  
✅ `tsconfig.json` - TypeScript strict mode  
✅ `tailwind.config.ts` - Tailwind CSS setup  
✅ `next.config.ts` - Next.js configuration  

### NOT Created (For Development Agent)

❌ Package installations  
❌ Database setup  
❌ Features or business logic  
❌ API endpoints  
❌ Components  

---

## 📖 Documentation Files Generated

### .github/copilot-instructions.md
Copy of `GENERIC_PROJECT_RULES.md` with:
- Communication standards
- Critical TypeScript rules
- Development environment setup
- Framework-specific conventions
- Git workflow guidelines

### PDR.md (Project Design Record)
Template structure with sections for:
- Project overview and objectives
- Technical stack
- Architecture decisions (placeholder)
- Data models (placeholder)
- API structure (placeholder)
- Key milestones
- Known constraints
- Revision history

Development Agent should update these as decisions are made.

### README.md
Quick-start guide including:
- Prerequisites
- Setup instructions
- Project structure overview
- Development guidelines
- Technology stack
- Testing instructions
- Links to key files

---

## 🔧 Using the Skill

### Example 1: Next.js Project

```
User: "Set up a Next.js project called 'AITutor' with PostgreSQL and OpenAI integration"

Agent: 
1. Confirms: ProjectName=AITutor, Type=next-js, Database=PostgreSQL, Services=OpenAI
2. Executes: .\init-project.ps1 -ProjectName "AITutor" -ProjectType "next-js" ...
3. Reports: Project created at Projects-26/AITutor/

Next Steps:
- cd Projects-26/AITutor/
- npm install
- Configure .env.local
- npm run dev
```

### Example 2: Python Project

```
User: "Initialize a new Python data analysis tool called 'DataViz'"

Agent:
1. Confirms: ProjectName=DataViz, Type=python, Database=SQLite
2. Executes: .\init-project.ps1 -ProjectName "DataViz" -ProjectType "python" ...
3. Reports: Project ready at Projects-26/DataViz/

Next Steps:
- cd Projects-26/DataViz/
- pip install -r requirements.txt
- python src/main.py
```

### Example 3: C# Project

```
User: "Create a new C# trading bot called 'TradeBot' for Projects-25"

Agent:
1. Confirms: ProjectName=TradeBot, Type=c-sharp, Year=25
2. Executes: .\init-project.ps1 -ProjectName "TradeBot" -ProjectType "c-sharp" -ProjectYear 25 ...
3. Reports: Project ready at Projects-25/TradeBot/

Next Steps:
- cd Projects-25/TradeBot/
- dotnet restore
- dotnet build
- dotnet run
```

---

## 🔗 Integration with Other Workflows

### With Project Planning Agent
1. **Project Setup Skill** creates basic scaffolding
2. **Project Planning Agent** updates PDR.md with detailed architecture
3. **Development Agent** implements features following PDR.md

### With Development Agent
1. **Project Setup Skill** creates project structure
2. **Development Agent** reads `.github/copilot-instructions.md` for rules
3. **Development Agent** installs dependencies and builds features
4. **Development Agent** updates PDR.md with implementation notes

### With Git Workflow
- First commit created automatically: "Initial project setup"
- Development Agent follows git checkpoints from instructions
- Professional commit history from project start

---

## 📚 Key Documentation

- **SKILL.md** - Full skill definition (read by Agent system)
- **USAGE_GUIDE.md** - Step-by-step examples for users
- **SKILL_STRUCTURE.md** - Technical architecture and design decisions
- **scripts/init-project.ps1** - Implementation details

---

## ⚙️ PowerShell Script Parameters

```powershell
.\init-project.ps1 `
  -ProjectName "MyProject"         # Required: Project name
  -ProjectType "next-js"           # Required: Framework (see supported list)
  -ProjectYear 26                  # Optional: Year (default 26 → Projects-26)
  -Description "Description"       # Optional: Project description
  -DatabaseType "PostgreSQL"       # Optional: Database type
  -ParentPath "C:\Users\..."       # Optional: Base path (default: Dropbox\Source)
```

---

## ✅ Quality Assurance

### Initialization Checklist
- [ ] Project directory created
- [ ] Git repository initialized
- [ ] `.github/copilot-instructions.md` copied
- [ ] `PDR.md` generated with all sections
- [ ] `README.md` created with setup instructions
- [ ] `.gitignore` appropriate for framework
- [ ] Configuration files generated (tsconfig, package.json, etc.)
- [ ] Initial git commit created
- [ ] All files formatted correctly

### Success Criteria
✅ Project structure matches framework conventions  
✅ All files are syntactically valid  
✅ Git repository ready for development  
✅ Development Agent can assume project immediately  
✅ No errors in initialization script  

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Script not found | Use full path: `C:\Users\cclem\...\scripts\init-project.ps1` |
| Permission denied | Ensure write access to Projects-[year]/ directory |
| Git not initialized | Check git installation, script should auto-initialize |
| Missing rules file | Ensure GENERIC_PROJECT_RULES.md exists at `.github/` |
| Config files empty | Check PowerShell string formatting, verify template syntax |

---

## 🎓 Learning Resources

- See **SKILL.md** for Agent workflow instructions
- See **USAGE_GUIDE.md** for user examples
- See **SKILL_STRUCTURE.md** for technical details
- See **references/nextjs-config.md** for framework specifics

---

## 📝 Notes

- **PowerShell Only**: Uses native PowerShell cmdlets, no Unix commands
- **Windows Focused**: Designed for Windows 11 + PowerShell environment
- **No Installation**: Script scaffolds but doesn't install packages
- **Git Ready**: Repository initialized with first commit
- **Documentation-Driven**: PDR.md and README.md guide development

---

## 🔮 Future Enhancements

Potential additions:
- Pre-built Next.js templates in `assets/nextjs-starter/`
- GitHub Actions workflow templates
- Docker/Docker Compose configurations
- Database migration templates
- Test suite templates (Jest, Vitest, pytest)
- ESLint configurations by framework
- CI/CD pipeline examples

---

**Version**: 1.0  
**Created**: January 22, 2026  
**Skill Type**: Project Initialization  
**Framework Support**: 8 frameworks + generic  

