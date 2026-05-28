# AI Tools Integration - Rules Files

This document explains how the project-setup skill now integrates AI tool-specific rules files.

## Overview

Every new project initialized through the project-setup skill automatically includes rules files for:

1. **Cursor IDE** - `.cursor/rules/critical.md`
2. **Windsurf IDE** - `.windsurf/rules/critical.md`
3. **Claude Code / Claude.ai** - `CLAUDE.md` (project root)
4. **Generic AI Agents** - `.agent/rules/critical.md`

These files are created during project initialization as part of the **Phase 2: Initialize Git Repository** step.

## What Gets Created

### 1. CLAUDE.md (Project Root)

**Purpose**: Guide Claude when working on this project via Claude Code or Claude.ai

**Location**: `project/CLAUDE.md`

**Content**:
- Reference to `.github/copilot-instructions.md` (master rules)
- Reference to `PDR.md` (architecture decisions)
- Quick reference rules for TypeScript strictness, file size limits, git workflow
- Key development principles

**Example**:
```markdown
# CLAUDE.md - Agent Instructions

This file provides guidance to Claude when working with this project.

## Essential Files

- **`.github/copilot-instructions.md`** - Complete project development rules
- **`PDR.md`** - Project Design Record with architecture decisions
- **`README.md`** - Project overview and setup guide

## Key Rules

- **Always** create git checkpoints before significant changes
- **Never** use generic `any` types in TypeScript
- **Always** use strongly typed objects or classes
- **Keep** files under 500 lines (split if necessary)
```

### 2. Cursor IDE Rules

**Location**: `project/.cursor/rules/critical.md`

**Purpose**: Provides critical.md for [Cursor IDE](https://www.cursor.com/) integration

**Content**: Identical to `CLAUDE.md` for consistency

**Integration**: Cursor automatically loads rules from `.cursor/rules/critical.md`

### 3. Windsurf IDE Rules

**Location**: `project/.windsurf/rules/critical.md`

**Purpose**: Provides rules for [Windsurf IDE](https://windsurf.dev/) integration

**Content**: Identical to `CLAUDE.md` for consistency

**Integration**: Windsurf automatically loads rules from `.windsurf/rules/critical.md`

### 4. Generic Agent Rules

**Location**: `project/.agent/rules/critical.md`

**Purpose**: Fallback rules file for any AI agents that don't use IDE-specific locations

**Content**: Identical to `CLAUDE.md` for consistency

**Use Case**: Used by custom agents or future AI tool integrations

## Relationship to Master Rules

```
┌─────────────────────────────────────────────────────────┐
│   GENERIC_PROJECT_RULES.md (Master Source)              │
│   Located at: .github/GENERIC_PROJECT_RULES.md          │
│   (Lives in master workspace, not per-project)          │
└─────────────────────────────────────────────────────────┘
                         ↓
           (Copied to each new project as)
                         ↓
┌─────────────────────────────────────────────────────────┐
│   .github/copilot-instructions.md (Master Copy)         │
│   Located at: project/.github/copilot-instructions.md   │
│   (Comprehensive development rules for this project)    │
└─────────────────────────────────────────────────────────┘
                         ↓
           (Distilled into quick-reference for each tool)
                         ↓
    ┌──────────────────┬──────────────────┬──────────────┐
    │                  │                  │              │
    ↓                  ↓                  ↓              ↓
CLAUDE.md      .cursor/rules/     .windsurf/rules/   .agent/rules/
(Project Root) critical.md        critical.md        critical.md
```

## Implementation Details

### How Project Initialization Creates Rules Files

In `scripts/init-project.ps1`, after git initialization:

```powershell
# Create AI Tool Rules Files
Write-Host "🤖 Creating AI tool rules files..." @Info

# Create CLAUDE.md in project root
$ClaudeRulesContent = @"
# CLAUDE.md - Agent Instructions
[Full content here]
"@
Set-Content -Path "$ProjectPath/CLAUDE.md" -Value $ClaudeRulesContent

# Create .cursor/rules/critical.md
New-Item -ItemType Directory -Path "$ProjectPath\.cursor\rules" -Force | Out-Null
Set-Content -Path "$ProjectPath\.cursor\rules\critical.md" -Value $ClaudeRulesContent

# Create .windsurf/rules/critical.md
New-Item -ItemType Directory -Path "$ProjectPath\.windsurf\rules" -Force | Out-Null
Set-Content -Path "$ProjectPath\.windsurf\rules\critical.md" -Value $ClaudeRulesContent

# Create .agent/rules/critical.md
New-Item -ItemType Directory -Path "$ProjectPath\.agent\rules" -Force | Out-Null
Set-Content -Path "$ProjectPath\.agent\rules\critical.md" -Value $ClaudeRulesContent
```

### Timing in Initialization Workflow

```
Phase 2: Initialize Git Repository
  ├─ git init
  ├─ git config (email, name)
  ├─ Copy GENERIC_PROJECT_RULES.md → .github/copilot-instructions.md
  ├─ Create CLAUDE.md
  ├─ Create .cursor/rules/critical.md
  ├─ Create .windsurf/rules/critical.md
  ├─ Create .agent/rules/critical.md
  └─ Add all to initial commit
```

## Framework-Specific Customization (Future)

Currently, all projects get identical AI tool rules content. In future versions, you could:

1. **Create framework-specific rules templates**:
   - `NextJS_RULES.md` for Next.js projects
   - `TypeScript_RULES.md` for pure TS projects
   - etc.

2. **Modify init-project.ps1 to select appropriate template**:
   ```powershell
   if ($ProjectType -eq "next-js") {
       $RulesTemplate = "NEXTJS_RULES.md"
   } elseif ($ProjectType -eq "typescript") {
       $RulesTemplate = "TYPESCRIPT_RULES.md"
   }
   ```

3. **Populate rules files with framework-specific content**

## Using These Files

### When Working in Cursor IDE
- Cursor automatically respects `.cursor/rules/critical.md`
- Rules guide code generation, refactoring, and auto-complete

### When Working in Windsurf IDE
- Windsurf automatically respects `.windsurf/rules/critical.md`
- Rules guide AI-assisted development features

### When Using Claude Code
- Open `CLAUDE.md` in Claude Code context
- Claude will follow the guidelines in the file

### When Using Generic Claude.ai
- Include `CLAUDE.md` or `.agent/rules/critical.md` in chat context
- Reference relevant rules when asking Claude to help

### When Using Other AI Agents
- Check project `.agent/rules/critical.md`
- Provide content to the agent in your prompt

## Managing Rules

### Updating Rules Across All Projects

If you need to update development rules across all projects:

1. **Edit GENERIC_PROJECT_RULES.md** in master workspace
2. **New projects** will automatically use updated version
3. **Existing projects** can be updated by:
   - Copying new GENERIC_PROJECT_RULES.md content
   - Replacing `.github/copilot-instructions.md` in each project
   - Updating CLAUDE.md and rules files manually (or re-run init script in a new project and copy files)

### Project-Specific Customizations

For project-specific rules:

1. **Keep `.github/copilot-instructions.md` as master** (copied from GENERIC)
2. **Add project-specific sections** to `CLAUDE.md`:
   ```markdown
   ## Project-Specific Guidelines
   
   This project uses [specific pattern/tool] for [reason]. All agents should:
   - [Custom rule 1]
   - [Custom rule 2]
   ```
3. Update `.cursor/rules/critical.md` and other files similarly

## Visibility in Version Control

All rules files are tracked in git:

```
Initial Commit "Initial project setup" includes:
  ├─ .github/copilot-instructions.md
  ├─ CLAUDE.md
  ├─ .cursor/rules/critical.md
  ├─ .windsurf/rules/critical.md
  ├─ .agent/rules/critical.md
  ├─ PDR.md
  ├─ README.md
  ├─ package.json (or equivalent)
  ├─ tsconfig.json (or equivalent)
  └─ ... other config files
```

This ensures all team members (human or AI) start with the same development guidelines.

## Benefits

✅ **Consistency** - Same rules across all AI tools and agents  
✅ **IDE Integration** - Automatic respect of Cursor and Windsurf rules  
✅ **Explicit** - Rules are visible and easy to modify  
✅ **Tracked** - Rules changes appear in git history  
✅ **Framework Support** - Future versions can tailor rules by framework  
✅ **Distributed** - Rules travel with the project, no external configuration needed

## Related Documents

- [SKILL.md](SKILL.md) - Complete project-setup skill documentation
- [../GENERIC_PROJECT_RULES.md](../GENERIC_PROJECT_RULES.md) - Master development rules
- [../scripts/init-project.ps1](../scripts/init-project.ps1) - PowerShell implementation
