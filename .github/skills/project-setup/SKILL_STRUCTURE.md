# Project Setup Skill - Skill Structure

## Directory Organization

```
project-setup/
├── SKILL.md                    # Main skill definition (required)
├── USAGE_GUIDE.md              # User-facing usage documentation
├── scripts/
│   └── init-project.ps1        # Main initialization script
├── references/
│   ├── README.md               # Navigation guide
│   └── nextjs-config.md        # Framework-specific configurations
└── assets/
    └── README.md               # Asset templates placeholder
```

## File Descriptions

### SKILL.md (Required)
- **Purpose**: Defines the skill for the Agent system
- **Contains**: Metadata (name, description), workflow instructions, framework info
- **Loaded**: Always (metadata) and when skill triggers (full content)
- **Key Sections**:
  - When to use this skill
  - Core workflow (4 phases)
  - Scaffolding details for each framework
  - Implementation details
  - Usage examples

### USAGE_GUIDE.md (Supporting)
- **Purpose**: Non-technical user guide for triggering the skill
- **Contains**: Step-by-step examples, command syntax, framework table
- **NOT loaded into Agent context** - for human reference

### scripts/init-project.ps1 (Core Implementation)
- **Purpose**: PowerShell script that does actual project initialization
- **Executed**: By Agent running initialization (called within SKILL.md workflow)
- **Responsibility**:
  - Creates directory structure
  - Initializes git repository
  - Generates framework-specific config files
  - Copies `.github/copilot-instructions.md`
  - Creates PDR.md and README.md templates
  - Creates initial git commit

**Parameters**:
```powershell
-ProjectName         # Required: Project name (e.g., "ContentRecommender")
-ProjectType         # Required: Framework (next-js, typescript, c-sharp, python, etc.)
-ProjectYear         # Optional: Year directory (default: 26 → Projects-26)
-Description         # Optional: Project description
-DatabaseType        # Optional: Database type
-ParentPath          # Optional: Base path (default: Dropbox\Source)
```

### references/nextjs-config.md (Knowledge Base)
- **Purpose**: Next.js 15 specific configuration reference
- **Loaded**: Only when Agent needs framework-specific details
- **Contains**:
  - Config file templates
  - Package.json dependencies
  - TypeScript configuration
  - Directory structure best practices
  - .gitignore patterns
  - Configuration modifications examples

### assets/ (Templates Directory)
- **Purpose**: Store reusable boilerplate files
- **Currently**: Placeholder for future templates
- **Planned**: Framework-specific starters, ESLint configs, GitHub Actions, Docker files

---

## Workflow Execution

### When Agent Triggers Skill

1. **Agent reads SKILL.md** (main definition)
2. **Agent asks user confirmation** (Phase 1 of workflow)
3. **Agent calls init-project.ps1** (Phase 2 of workflow)
   ```powershell
   .\scripts\init-project.ps1 -ProjectName "X" -ProjectType "Y" ...
   ```
4. **Script creates directory structure** (Phase 3 of workflow)
5. **Agent reviews generated files** (Phase 4 of workflow)
6. **Agent hands off to development agent**

### Data Flow

```
User Request
    ↓
Agent reads SKILL.md (metadata + instructions)
    ↓
Agent confirms project details with user
    ↓
Agent executes init-project.ps1 script
    ↓
Script creates directory structure + files
    ↓
Script reads GENERIC_PROJECT_RULES.md (copies to project)
    ↓
Script generates PDR.md (from templates in SKILL.md)
    ↓
Script generates README.md (from templates in SKILL.md)
    ↓
Script initializes git + creates checkpoint
    ↓
Agent confirms completion
    ↓
Development Agent assumes project
```

---

## Key Design Decisions

### Progressive Disclosure

- **SKILL.md**: Core instructions (~150 lines)
- **references/nextjs-config.md**: Detailed framework info (loaded only when needed)
- **scripts/**: Executable code (don't need to be read into context)
- **assets/**: Templates (referenced but not loaded)

### Separation of Concerns

| Component | Responsibility |
|-----------|-----------------|
| SKILL.md | Define workflow, explain to Agent |
| init-project.ps1 | Execute directory creation, file generation |
| references/ | Provide detailed technical reference |
| assets/ | Store reusable templates (future) |

### Why PowerShell?

✅ Native Windows support (project workspace uses Windows 11)  
✅ File system operations more reliable than cross-platform tools  
✅ Can be executed directly without loading into Agent context  
✅ Consistent with project's PowerShell-first convention  

### Template Strategy

Templates are embedded in:
1. **SKILL.md** - For simple, essential templates (PDR.md, README.md)
2. **scripts/init-project.ps1** - For config file generation (package.json, tsconfig.json)
3. **references/** - For detailed reference material (not needed during initialization)

This keeps initialization fast while providing comprehensive reference material when needed.

---

## Future Extensibility

### Adding New Frameworks

To add support for a new framework (e.g., Svelte):

1. **Update SKILL.md**:
   - Add `svelte` to supported frameworks list
   - Add "Svelte Scaffolding" section with directory structure
   - Add to framework table

2. **Update init-project.ps1**:
   - Add `"svelte"` to ValidateSet parameter
   - Add new `switch` case for Svelte directory creation
   - Add config file generation for svelte.config.js, package.json, etc.

3. **Create references/svelte-config.md** (optional):
   - Svelte-specific configuration templates
   - Load when Agent needs framework details

### Adding New Reference Files

1. Create `references/[framework]-config.md`
2. Reference in SKILL.md with pattern: "See `references/[framework]-config.md` for..."
3. Include grep search patterns if file is large

### Adding Asset Templates

1. Add files/directories to `assets/` (e.g., `assets/nextjs-starter/`)
2. Reference in SKILL.md: "See `assets/[template]/` for..."
3. Script can copy/modify assets during initialization if needed

---

## Integration Points

### With GENERIC_PROJECT_RULES.md
- `init-project.ps1` copies GENERIC_PROJECT_RULES.md to `.github/copilot-instructions.md`
- Project-specific customizations added automatically

### With Project Planning Agent
- Recommended to create detailed PDR.md after this skill initializes
- PDR.md template provides structure for Planning Agent

### With Development Agent
- Development Agent reads `.github/copilot-instructions.md` for rules
- Development Agent updates PDR.md with architecture decisions
- Development Agent manages feature development and git commits

---

## Quality Assurance

### Files Created Are Always:
✅ Syntactically correct (JSON, TypeScript, etc.)  
✅ Properly formatted with correct indentation  
✅ Include necessary comments/documentation  
✅ Follow project conventions from GENERIC_PROJECT_RULES.md  

### Initial Git Commit Includes:
✅ All scaffolded files and directories  
✅ Commit message: "Initial project setup: [ProjectName] ([ProjectType])"  
✅ Prepared but not pushed (development happens locally first)  

### Project is Ready For:
✅ Package installation (`npm install`, `pip install`, etc.)  
✅ Environment configuration (.env files)  
✅ Feature development  
✅ Git commit history from day one  

---

## Related Documentation

- **SKILL.md** - Main skill file (read by Agent)
- **USAGE_GUIDE.md** - User documentation (for humans)
- **GENERIC_PROJECT_RULES.md** - Master project rules (copied into projects)
- **copilot-instructions.md** (in master workspace) - Overall workspace guidelines

---

## Testing the Skill

To test skill functionality:

1. **Run script directly**:
   ```powershell
   cd C:\Users\cclem\Dropbox\Source\.github\skills\project-setup\scripts
   .\init-project.ps1 -ProjectName "TestProject" -ProjectType "next-js" -ProjectYear 26
   ```

2. **Verify created files**:
   - Check `Projects-26/TestProject/` directory exists
   - Verify all expected files are present
   - Check `.github/copilot-instructions.md` has content
   - Verify git repository initialized (`git log` shows initial commit)

3. **Verify file contents**:
   - Check `package.json` has Next.js dependencies
   - Check `tsconfig.json` is valid TypeScript config
   - Check `PDR.md` has all sections
   - Check `README.md` has setup instructions

4. **Agent testing**:
   - Trigger skill with user request
   - Agent should confirm project details
   - Agent should execute script
   - Agent should report completion

---

