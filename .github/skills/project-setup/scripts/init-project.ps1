# Project Initialization Script
# Initialize new projects with proper scaffolding, git, and config files
# Usage: .\init-project.ps1 -ProjectName "MyProject" -ProjectType "next-js" -ProjectYear 26

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("next-js", "typescript", "c-sharp", "python", "tradingview", "rust", "go", "generic")]
    [string]$ProjectType,
    
    [Parameter(Mandatory=$false)]
    [int]$ProjectYear = 26,
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "Project to be built",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseType = "TBD",
    
    [Parameter(Mandatory=$false)]
    [string]$ParentPath = "C:\Users\cclem\Dropbox\Source"
)

# Colors for output
$Success = @{ ForegroundColor = "Green" }
$Warning = @{ ForegroundColor = "Yellow" }
$ErrorStyle = @{ ForegroundColor = "Red" }
$Info = @{ ForegroundColor = "Cyan" }

Write-Host "========================================" @Info
Write-Host "Project Initialization: $ProjectName" @Info
Write-Host "========================================" @Info
Write-Host ""

# Validate paths
$ProjectsDir = Join-Path $ParentPath "Projects-$ProjectYear"
$ProjectPath = Join-Path $ProjectsDir $ProjectName

if (Test-Path $ProjectPath) {
    Write-Host "ERROR: Project directory already exists: $ProjectPath" @ErrorStyle
    exit 1
}

Write-Host "📁 Creating project directory structure..." @Info

# Create project directory
New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectPath\.github" -Force | Out-Null

Write-Host "✓ Project directory created at: $ProjectPath" @Success

# Create framework-specific directories
Write-Host "📂 Creating framework-specific structure ($ProjectType)..." @Info

switch ($ProjectType) {
    "next-js" {
        @("app/api", "app/(features)", "src/lib/types", "src/lib/hooks", "src/lib/utils", 
          "src/lib/db", "src/lib/ai", "src/components", "src/server", "src/storage", "public") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        # Create Next.js config files
        $NextConfig = @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopack: true,
  },
};

module.exports = nextConfig;
"@
        Set-Content -Path "$ProjectPath/next.config.ts" -Value $NextConfig
        
        # Create tsconfig
        $TsConfig = @{
            compilerOptions = @{
                target = "ES2020"
                lib = @("ES2020", "DOM", "DOM.Iterable")
                jsx = "react-jsx"
                module = "ESNext"
                moduleResolution = "bundler"
                resolveJsonModule = $true
                allowImportingTsExtensions = $true
                noEmit = $true
                strict = $true
                esModuleInterop = $true
                skipLibCheck = $true
                forceConsistentCasingInFileNames = $true
                baseUrl = "."
                paths = @{
                    "@/*" = @("src/*", "app/*")
                }
                types = @("node")
            }
            include = @("next-env.d.ts", "**/*.ts", "**/*.tsx", "app/**/*")
            exclude = @("node_modules")
        }
        $TsConfigJson = $TsConfig | ConvertTo-Json -Depth 10
        Set-Content -Path "$ProjectPath/tsconfig.json" -Value $TsConfigJson
        
        # Create Tailwind config
        $TailwindConfig = @"
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
"@
        Set-Content -Path "$ProjectPath/tailwind.config.ts" -Value $TailwindConfig
        
        # Create package.json
        $PackageJson = @{
            name = $ProjectName
            version = "0.1.0"
            description = $Description
            scripts = @{
                dev = "next dev"
                build = "next build"
                start = "next start"
                lint = "eslint ."
            }
            dependencies = @{
                next = "15.1.3"
                react = "19.0.0"
                "react-dom" = "19.0.0"
            }
            devDependencies = @{
                typescript = "5.7.2"
                "@types/node" = "^20.0.0"
                "@types/react" = "^18.0.0"
                "@types/react-dom" = "^18.0.0"
                tailwindcss = "^4.0.0"
                "@tailwindcss/typography" = "^0.5.0"
                autoprefixer = "^10.4.0"
                postcss = "^8.4.0"
                eslint = "^8.0.0"
                "@next/eslint-config-next" = "15.1.3"
            }
        }
        $PackageJsonContent = $PackageJson | ConvertTo-Json -Depth 10
        Set-Content -Path "$ProjectPath/package.json" -Value $PackageJsonContent
        
        # Create .env.local
        Set-Content -Path "$ProjectPath/.env.local" -Value "# Environment variables for $ProjectName`n`n# Database`n# DATABASE_URL=`n`n# API Keys`n# OPENAI_API_KEY=`n`n# Services`n# STRIPE_SECRET_KEY=`n"
    }
    
    "typescript" {
        @("src/lib", "src/types", "src/utils", "dist") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        $TsConfig = @{
            compilerOptions = @{
                target = "ES2020"
                module = "ESNext"
                lib = @("ES2020")
                outDir = "./dist"
                rootDir = "./src"
                strict = $true
                esModuleInterop = $true
                skipLibCheck = $true
                forceConsistentCasingInFileNames = $true
                resolveJsonModule = $true
                declaration = $true
                declarationMap = $true
                sourceMap = $true
            }
            include = @("src/**/*")
            exclude = @("node_modules", "dist")
        }
        $TsConfigJson = $TsConfig | ConvertTo-Json -Depth 10
        Set-Content -Path "$ProjectPath/tsconfig.json" -Value $TsConfigJson
        
        $PackageJson = @{
            name = $ProjectName
            version = "0.1.0"
            description = $Description
            main = "dist/index.js"
            types = "dist/index.d.ts"
            scripts = @{
                build = "tsc"
                dev = "tsc --watch"
                lint = "eslint src"
            }
            devDependencies = @{
                typescript = "5.7.2"
                "@types/node" = "^20.0.0"
                eslint = "^8.0.0"
            }
        }
        $PackageJsonContent = $PackageJson | ConvertTo-Json -Depth 10
        Set-Content -Path "$ProjectPath/package.json" -Value $PackageJsonContent
        
        Set-Content -Path "$ProjectPath/src/index.ts" -Value "// Main entry point`n`nexport const greeting = 'Hello, TypeScript!';`n"
    }
    
    "c-sharp" {
        @("src/Models", "src/Services", "src/Utils", "tests") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        $CsProjContent = @"
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Library</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>$($ProjectName.Replace('-', '').Replace(' ', ''))</RootNamespace>
    <AssemblyName>$($ProjectName.Replace('-', '').Replace(' ', ''))</AssemblyName>
  </PropertyGroup>

</Project>
"@
        Set-Content -Path "$ProjectPath/src/$ProjectName.csproj" -Value $CsProjContent
        
        Set-Content -Path "$ProjectPath/src/Program.cs" -Value "// Entry point for $ProjectName`nnamespace $($ProjectName.Replace('-', '').Replace(' ', ''))`n{`n    class Program`n    {`n        static void Main(string[] args)`n        {`n            Console.WriteLine(`"$ProjectName initialized`");`n        }`n    }`n}`n"
    }
    
    "python" {
        @("src/lib", "src/models", "src/utils", "tests") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        Set-Content -Path "$ProjectPath/requirements.txt" -Value "# Add dependencies here`n# Example: requests==2.31.0`n"
        
        Set-Content -Path "$ProjectPath/src/main.py" -Value "#!/usr/bin/env python3`n`"`"`"Main entry point for $ProjectName`"`"`"`n`ndef main():`n    print(f'$ProjectName initialized')`n`nif __name__ == '__main__':`n    main()`n"
        
        Set-Content -Path "$ProjectPath/.env" -Value "# Environment variables for $ProjectName`n`n# Database`n# DATABASE_URL=`n`n# API Keys`n# API_KEY=`n"
    }
    
    "tradingview" {
        @("indicators", "strategies", "libraries", "data") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        Set-Content -Path "$ProjectPath/indicators/.gitkeep" -Value ""
        Set-Content -Path "$ProjectPath/strategies/.gitkeep" -Value ""
        Set-Content -Path "$ProjectPath/libraries/.gitkeep" -Value ""
    }
    
    "rust" {
        $CargoToml = @"
[package]
name = "$($ProjectName.ToLower().Replace(' ', '_').Replace('-', '_'))"
version = "0.1.0"
edition = "2021"
description = "$Description"

[dependencies]

[dev-dependencies]
"@
        Set-Content -Path "$ProjectPath/Cargo.toml" -Value $CargoToml
        
        @("src") | ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        Set-Content -Path "$ProjectPath/src/main.rs" -Value "fn main() {`n    println!(`"$ProjectName initialized`");`n}`n"
    }
    
    "go" {
        $GoMod = @"
module $($ProjectName.ToLower().Replace(' ', '-'))

go 1.21
"@
        Set-Content -Path "$ProjectPath/go.mod" -Value $GoMod
        
        @("cmd", "internal", "pkg") | ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
        
        Set-Content -Path "$ProjectPath/cmd/main.go" -Value 'package main

import "fmt"

func main() {
    fmt.Println("' + $ProjectName + ' initialized")
}
'
    }
    
    "generic" {
        @("src", "docs") | 
        ForEach-Object { New-Item -ItemType Directory -Path "$ProjectPath/$_" -Force | Out-Null }
    }
}

Write-Host "✓ Framework-specific structure created" @Success

# Create .gitignore
Write-Host "📝 Creating .gitignore..." @Info

$GitignoreContent = @"
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
dist/
build/
*.egg-info/
__pycache__/
*.pyc
*.pyo
target/
vendor/
bin/
obj/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build outputs
/dist/
/build/
/out/

# Logs
*.log
npm-debug.log*

# OS
Thumbs.db
.DS_Store

# Project-specific
.next/
*.o
*.a
.cargo/
"@
Set-Content -Path "$ProjectPath/.gitignore" -Value $GitignoreContent

# Initialize Git
Write-Host "🔧 Initializing Git repository..." @Info
Push-Location $ProjectPath
git init | Out-Null
git config user.email "halimedetech@gmail.com" -ErrorAction SilentlyContinue
git config user.name "Claude Agent" -ErrorAction SilentlyContinue

# Function to copy copilot_setup template directory
function Copy-CopilotSetupTemplate {
    param (
        [string]$ProjectPath,
        [string]$ProjectName,
        [string]$ProjectType,
        [string]$Description,
        [string]$DatabaseType,
        [int]$ProjectYear
    )
    
    $skillPath = Join-Path $ParentPath ".github\skills\project-setup"
    $templatePath = Join-Path $skillPath "copilot_setup\.github"
    $targetPath = Join-Path $ProjectPath ".github"
    
    Write-Host "  📚 Copying copilot_setup template to project..." @Info
    
    if (Test-Path $templatePath) {
        # Copy the entire .github structure from template
        Copy-Item -Path "$templatePath\*" -Destination $targetPath -Recurse -Force

        # Scrub copied skill/template files that may contain populated environment values.
        $skillsPath = Join-Path $targetPath "skills"
        if (Test-Path $skillsPath) {
            $textExtensions = @(".md", ".markdown", ".mdx", ".txt", ".yaml", ".yml", ".json", ".ps1", ".ts", ".tsx", ".js", ".jsx", ".env", ".config", ".toml")
            $secretKeys = @(
                "OPENAI_API_KEY",
                "ANTHROPIC_API_KEY",
                "GOOGLE_API_KEY",
                "AWS_ACCESS_KEY_ID",
                "AWS_SECRET_ACCESS_KEY",
                "STRIPE_SECRET_KEY",
                "NEXTAUTH_SECRET",
                "AUTH_SECRET"
            )

            Get-ChildItem -Path $skillsPath -Recurse -File | ForEach-Object {
                $file = $_
                $ext = [System.IO.Path]::GetExtension($file.Name)
                if ($textExtensions -contains $ext) {
                    try {
                        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
                        foreach ($key in $secretKeys) {
                            $content = [regex]::Replace($content, "(?m)^(\s*$key\s*=\s*).*$", '$1')
                            $content = [regex]::Replace($content, "(?m)^(\s*$key\s*:\s*).*$", '$1')
                        }
                        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
                    } catch {
                        Write-Host "  ⚠️ Skipped scrubbing $($file.FullName)" @Warning
                    }
                }
            }
        }
        
        # Update copilot-instructions.md with project-specific details
        $instructionsPath = Join-Path $targetPath "copilot-instructions.md"
        
        if (Test-Path $instructionsPath) {
            $content = Get-Content -Path $instructionsPath -Raw
            
            # Replace placeholder values
            $content = $content -replace 'ConceptAlchemy', $ProjectName
            $content = $content -replace 'next-js', $ProjectType
            $content = $content -replace 'Interactive vector-based lyric exploration tool using pgvector for semantic search and AI-assisted composition', $Description
            $content = $content -replace 'postgresql', $DatabaseType
            $content = $content -replace 'openai,anthropic', 'TBD'
            $content = $content -replace '\{\{PROJECT_YEAR\}\}', $ProjectYear
            
            Set-Content -Path $instructionsPath -Value $content -Encoding UTF8
            
            Write-Host "  ✓ Copilot setup template copied and customized" @Success
            Write-Host "  ✓ Included: agents, prompts, skills (brand-identity, frontend-design)" @Success
            Write-Host "  ✓ Scrubbed copied .github/skills env values" @Success
        }
    } else {
        Write-Host "  ⚠️ Copilot setup template not found at $templatePath" @Warning
        Write-Host "  Creating minimal project instructions..." @Info
        
        # Fallback to basic template if copilot_setup not found
        $basicRules = @"
# GitHub Copilot Instructions - $ProjectName

## 🎯 PROJECT PURPOSE

**Project Name**: $ProjectName  
**Framework**: $ProjectType  
**Description**: $Description

**CRITICAL**: This project inherits universal coding standards from the Master Workspace.

---

## Environment
- **OS**: Windows 11
- **Shell**: PowerShell (use ``;`` for command chaining, never ``&&``)
- **Runtime**: Project-specific
- **Framework**: $ProjectType

---

## 🚨 CRITICAL PLATFORM RULES (NO EXCEPTIONS)

### 1. NEVER START/STOP/MANAGE DEV SERVERS
**This is non-negotiable.** Agents must NEVER run development servers.

### 2. Core Development Rules
- **NEVER use ``any`` types** in TypeScript
- **Create checkpoints before changes**: ``git add .; git commit -m "checkpoint: before [change]"``
- **PowerShell syntax**: Use ``;`` not ``&&``
- Keep files under 500 lines

---

## Project-Specific Guidelines

### Database
- **Type**: $DatabaseType

### File Organization
See ``PDR.md`` for architecture details and ``README.md`` for setup instructions.
"@
        Set-Content -Path (Join-Path $targetPath "copilot-instructions.md") -Value $basicRules -Encoding UTF8
    }
}

# Copy copilot_setup template
Copy-CopilotSetupTemplate -ProjectPath $ProjectPath -ProjectName $ProjectName -ProjectType $ProjectType -Description $Description -DatabaseType $DatabaseType -ProjectYear $ProjectYear

# Legacy: Also check for GENERIC_PROJECT_RULES.md (kept for backward compatibility)
$RulesPath = Join-Path $ParentPath ".github\GENERIC_PROJECT_RULES.md"
if (Test-Path $RulesPath) {
    Write-Host "📋 Found GENERIC_PROJECT_RULES.md (legacy support)" @Info
}

# Create AI Tool Rules Files
Write-Host "🤖 Creating AI tool rules files..." @Info

# Create CLAUDE.md in project root
$ClaudeRulesContent = @"
# CLAUDE.md - Agent Instructions

This file provides guidance to Claude when working with this project.

## Essential Files

- **`.github/copilot-instructions.md`** - Complete project development rules and conventions (includes inherited workspace standards)
- **`PDR.md`** - Project Design Record with architecture decisions
- **`README.md`** - Project overview and setup guide
- **Master Workspace Rules**: ``C:\Users\cclem\Dropbox\Source\.github\copilot-instructions.md``

## Critical Inherited Standards

**TypeScript**: No ``any`` types, DRY principle, files under 500 lines
**PowerShell**: Use ``;`` for chaining (never ``&&``)
**Git**: Create checkpoints before significant changes

## Quick Start

1. Read `.github/copilot-instructions.md` for project-specific rules and inherited workspace standards
2. Review `PDR.md` for architectural decisions
3. Follow git conventions: \`git add . ; git commit -m "checkpoint: before [change]"\`
4. Maintain TypeScript strictness (no \`any\` types)
5. Keep files under 500 lines
6. Separate business logic from framework handlers

## 🚫 ABSOLUTE PROHIBITIONS

1. **NEVER run the dev server** - Do NOT execute \`npm run dev\`, \`npm start\`, or any server commands
2. **NEVER run \`npm install\`** without explicit user permission
3. **NEVER auto-commit** - Only create checkpoints when explicitly doing file modifications
4. **NEVER use \`&&\`** - This is PowerShell (Windows), use \`;\` for command chaining
5. **NEVER write \`any\` types** - TypeScript strict mode is enforced
6. **NEVER create mock implementations** - Use "Not Implemented" placeholders instead

## ✅ REQUIRED BEHAVIORS

1. **READ instructions first** - Always check \`.github/copilot-instructions.md\` before starting
2. **CREATE git checkpoints** - Before any file edits: \`git add . ; git commit -m "checkpoint: before [change]"\`
3. **CONFIRM plans** - Explain multi-step operations, wait for user approval
4. **ASK before structural changes** - Don't assume, get permission first
5. **USE PowerShell syntax** - Semicolons for chaining, native Windows commands

## Key Rules

- **Always** create git checkpoints before significant changes
- **Never** use generic \`any\` types in TypeScript
- **Never** create new types - only Master Agent creates types
- **Always** use strongly typed objects or classes
- **Always** separate business logic from API route handlers
- **Keep** files under 500 lines (split if necessary)
- **Take** AI-first approach when applicable
- **Keep** LLM prompts separate from business logic

## Project Structure

See \`PDR.md\` for architecture and \`README.md\` for setup instructions.

## For Questions

1. Check \`.github/copilot-instructions.md\` first
2. Review \`PDR.md\` for design decisions
3. See \`README.md\` for setup/usage
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

Write-Host "✓ AI tool rules files created" @Success

# Create PDR.md
Write-Host "📄 Creating PDR.md (Project Design Record)..." @Info

$Date = Get-Date -Format "MMMM d, yyyy"

$PDRContent = @"
# Project Design Record - $ProjectName

**Created**: $Date  
**Framework**: $ProjectType  
**Status**: Initialization complete, awaiting development

---

## 1. Project Overview

$Description

**Problem Statement**: [To be determined by development agent]

**Solution Approach**: [To be determined by development agent]

---

## 2. Core Objectives

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

---

## 3. Technical Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| Framework | $ProjectType | |
| Language | $(if ($ProjectType -eq "c-sharp") { "C#" } elseif ($ProjectType -eq "python") { "Python" } elseif ($ProjectType -eq "tradingview") { "Pine Script" } elseif ($ProjectType -eq "rust") { "Rust" } elseif ($ProjectType -eq "go") { "Go" } else { "TypeScript" }) | |
| Database | $DatabaseType | |
| Key Services | TBD | |
| Deployment | TBD | |

---

## 4. Architecture

[To be filled by development agent]

### High-Level Structure

[To be filled by development agent]

### Key Components

[To be filled by development agent]

---

## 5. Data Models

[To be filled by development agent]

### Core Entities

[To be filled by development agent]

---

## 6. API Structure
$(if ($ProjectType -eq "next-js") { "`n[To be filled by development agent]`n`n### API Endpoints`n`n[To be filled by development agent]" } else { "`n[Not applicable for $ProjectType projects]" })

---

## 7. Key Features (MVP)

1. Feature 1
   - Acceptance Criteria: [TBD]
   - Dependencies: [TBD]

2. Feature 2
   - Acceptance Criteria: [TBD]
   - Dependencies: [TBD]

3. Feature 3
   - Acceptance Criteria: [TBD]
   - Dependencies: [TBD]

---

## 8. Project Milestones

- [ ] Phase 1: Setup & Architecture (Current)
- [ ] Phase 2: Core Feature Development
- [ ] Phase 3: Integration & Testing
- [ ] Phase 4: Refinement & Optimization
- [ ] Phase 5: Deployment Preparation

---

## 9. Known Constraints & Considerations

- TBD

---

## 10. Next Steps

1. Development agent reviews this PDR
2. Update sections marked [To be determined by development agent]
3. Begin implementation according to architecture decisions
4. Maintain git discipline with descriptive commit messages
5. Follow `.github/copilot-instructions.md` conventions

---

## 11. Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| $Date | 1.0 | Initial project scaffolding | Claude Agent |

"@

Set-Content -Path "$ProjectPath/PDR.md" -Value $PDRContent

# Create README.md
Write-Host "📖 Creating README.md..." @Info

$ReadmeContent = @"
# $ProjectName

$Description

## Quick Start

### Prerequisites

$(switch ($ProjectType) {
    "next-js" { "- Node.js 18 or higher`n- npm or pnpm`n- Git" }
    "typescript" { "- Node.js 18 or higher`n- npm or pnpm`n- Git" }
    "c-sharp" { "- .NET 8.0 SDK or higher`n- Git" }
    "python" { "- Python 3.9 or higher`n- pip or Poetry`n- Git" }
    "tradingview" { "- TradingView account`n- Git" }
    "rust" { "- Rust 1.70 or higher (rustup)`n- Cargo`n- Git" }
    "go" { "- Go 1.21 or higher`n- Git" }
    default { "- Git`n- Project-specific dependencies (TBD)" }
})

### Setup

1. **Clone or navigate to the project**
   ```powershell
   cd $ProjectName
   ```

2. **Install dependencies**
   ```powershell
   $(switch ($ProjectType) {
       "next-js" { "npm install" }
       "typescript" { "npm install" }
       "c-sharp" { "dotnet restore" }
       "python" { "pip install -r requirements.txt" }
       "tradingview" { "# No installation needed" }
       "rust" { "cargo build" }
       "go" { "go mod download" }
       default { "# Install dependencies as needed" }
   })
   ```

3. **Configure environment**
   ```powershell
   $(switch ($ProjectType) {
       "next-js" { "cp .env.local.example .env.local" }
       "python" { "cp .env.example .env" }
       default { "# Configure environment variables" }
   })
   ```

4. **Start development**
   ```powershell
   $(switch ($ProjectType) {
       "next-js" { "npm run dev" }
       "typescript" { "npm run dev" }
       "c-sharp" { "dotnet run" }
       "python" { "python src/main.py" }
       "rust" { "cargo run" }
       "go" { "go run cmd/main.go" }
       default { "# Start your application" }
   })
   ```

## Project Structure

\`\`\`
$ProjectName/
├── .github/
│   └── copilot-instructions.md    # Agent development rules
├── PDR.md                          # Project Design Record
├── README.md                       # This file
$(switch ($ProjectType) {
    "next-js" { "├── app/                        # Next.js App Router`n├── src/                        # Source code`n├── public/                     # Static assets`n├── package.json`n├── tsconfig.json`n├── tailwind.config.ts`n└── .env.local" }
    "typescript" { "├── src/                        # Source code`n├── dist/                       # Compiled output`n├── package.json`n└── tsconfig.json" }
    "c-sharp" { "├── src/                        # Source code`n├── tests/                      # Unit tests`n└── *.csproj                    # Project files" }
    "python" { "├── src/                        # Source code`n├── tests/                      # Unit tests`n├── requirements.txt`n└── .env" }
    "tradingview" { "├── indicators/                 # TradingView indicators`n├── strategies/                 # Trading strategies`n├── libraries/                  # Reusable libraries`n└── data/                       # Data files" }
    "rust" { "├── src/                        # Source code`n├── Cargo.toml`n└── Cargo.lock" }
    "go" { "├── cmd/                        # Command-line applications`n├── internal/                   # Internal packages`n├── pkg/                        # Public packages`n└── go.mod" }
    default { "├── src/                        # Source code`n└── docs/                       # Documentation" }
})
\`\`\`

## Key Files

- **`.github/copilot-instructions.md`** - Agent development rules and conventions for this project
- **`PDR.md`** - Project Design Record with architectural decisions and feature specifications
- **`README.md`** - This file

## Development Guidelines

### Follow Project Rules

All development must follow the guidelines in `.github/copilot-instructions.md`. Key rules include:

- Always create git checkpoints before major changes: \`git add .; git commit -m "checkpoint: before [change]"\`
- Use strongly typed code (no \`any\` types in TypeScript)
- Keep business logic separate from framework handlers
- Keep files under 500 lines
- Use descriptive variable names

### Git Workflow

Use descriptive commit messages:

- \`checkpoint: before [change]\` - Before significant refactors
- \`feat: [description]\` - New features
- \`fix: [description]\` - Bug fixes
- \`refactor: [description]\` - Code reorganization

### Testing

$(switch ($ProjectType) {
    "next-js" { "- Create test pages in \`/tests/\` directory for rapid iteration" }
    "typescript" { "- Write tests in \`/tests/\` directory" }
    "c-sharp" { "- Add unit tests to \`/tests/\` directory" }
    "python" { "- Add unit tests to \`/tests/\` directory" }
    default { "- [TBD]" }
})

## Technologies

- **Framework**: $ProjectType
- **Database**: $DatabaseType

For more details, see \`PDR.md\`.

## Getting Help

1. Read \`.github/copilot-instructions.md\` for project-specific rules
2. Check \`PDR.md\` for architectural decisions
3. Review comments in source code for implementation notes

## Project Status

- Created: $Date
- Framework: $ProjectType
- Status: **Ready for development**

---

**Note**: This project was initialized using the Project Setup Skill. The basic scaffolding is complete. Development agent should now:

1. Install dependencies
2. Update \`PDR.md\` with final architectural decisions
3. Begin feature implementation according to \`.github/copilot-instructions.md\`

"@

Set-Content -Path "$ProjectPath/README.md" -Value $ReadmeContent

# Add initial files and commit
Write-Host "✅ Staging initial commit..." @Info

git add . 2>$null | Out-Null
git commit -m "Initial project setup: $ProjectName ($ProjectType)" 2>$null | Out-Null

Pop-Location

Write-Host ""
Write-Host "========================================" @Success
Write-Host "✅ Project Initialization Complete!" @Success
Write-Host "========================================" @Success
Write-Host ""
Write-Host "Project Details:" @Info
Write-Host "  Name: $ProjectName" @Info
Write-Host "  Type: $ProjectType" @Info
Write-Host "  Path: $ProjectPath" @Info
Write-Host "  Database: $DatabaseType" @Info
Write-Host ""
Write-Host "✅ Template Structure Copied:" @Success
Write-Host "  - .github/copilot-instructions.md (customized)" @Success
Write-Host "  - .github/agents/ (Plan/Execute/Verify)" @Success
Write-Host "  - .github/prompts/ (Reusable templates)" @Success
Write-Host "  - .github/skills/ (brand-identity, frontend-design)" @Success
Write-Host ""
Write-Host "Next Steps:" @Info
Write-Host "  1. Navigate to the project: cd '$ProjectPath'" @Info
Write-Host "  2. Install dependencies (npm install, pip install, dotnet restore, etc.)" @Info
Write-Host "  3. Review PDR.md for project architecture" @Info
Write-Host "  4. Read .github/copilot-instructions.md for development rules" @Info
Write-Host "  5. Begin development" @Info
Write-Host ""
Write-Host "Key Files:" @Info
Write-Host "  - PDR.md - Project Design Record" @Info
Write-Host "  - README.md - Developer guide" @Info
Write-Host "  - .github/copilot-instructions.md - Agent rules (auto-customized)" @Info
Write-Host "  - .github/agents/ - Three-agent orchestration system" @Info
Write-Host "  - .github/skills/brand-identity/ - Design system & brand guidelines" @Info
Write-Host ""
