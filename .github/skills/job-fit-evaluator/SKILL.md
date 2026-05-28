---
name: job-fit-evaluator
description: Evaluates job descriptions against the user's optimal role fit profile before proceeding with any job application work (resume tailoring, interview prep, etc.). CRITICAL - Use this skill IMMEDIATELY when the user provides a job description or asks for help with a specific job opportunity. If the role does not match HIGH FIT criteria, STOP and warn the user before proceeding with any application materials.
---

# Job Fit Evaluator

This skill protects the user from wasting time on mismatched job opportunities by evaluating role fit BEFORE starting application work.

## When to Use This Skill

**TRIGGER IMMEDIATELY when:**
- User shares a job description, job posting URL, or job requirements
- User asks to tailor a resume for a specific role
- User requests interview prep for a specific company/position
- User mentions applying to a job or preparing application materials

**DO NOT proceed with application work until this evaluation is complete.**

## Evaluation Process

### Step 1: Extract Job Requirements

Identify from the job description:
- **Job title** and seniority level
- **Required technical skills** (languages, frameworks, tools)
- **Required processes** (CI/CD, Agile, testing frameworks, DevOps)
- **Team structure** (solo, small team, large enterprise team)
- **Domain focus** (frontend, backend, AI/ML, infrastructure, etc.)
- **Company size/type** (startup, mid-size, enterprise, FAANG)

### Step 2: Match Against Fit Categories

#### [HIGH FIT] ROLES (Proceed with confidence)
- **AI Applications Engineer** - Building LLM products, agent systems
- **Solutions Architect** - Customer-facing, creative problem-solving, integration work
- **Developer Relations** - Technical + communication, developer education
- **Senior Full-Stack (Next.js focus)** - Modern web stack, React, TypeScript
- **Technical Consultant** - Project-based, outcome-focused work
- **Fractional CTO** - Small companies needing broad technical leadership

**HIGH FIT indicators:**
- Emphasizes building/shipping products over process
- Values innovation and creative problem-solving
- Modern tech stack (Next.js, React, TypeScript, AI/LLM)
- Small to mid-size team or customer-facing role
- Outcome-focused over process-focused
- Mentions AI/agent systems, real-time systems, or cost optimization

#### [MEDIUM FIT] ROLES (Proceed with caution - significant prep needed)
- **Staff/Senior Engineer (startups)** - IF they value builders over pedigree
- **Technical PM** - IF they emphasize technical background over MBA/process
- **AI Prompt Engineer** - Competitive, but Blockarized project demonstrates expertise

**MEDIUM FIT indicators:**
- Requires team collaboration experience (user is primarily solo developer)
- Mentions Agile/Scrum ceremonies and formal sprint processes
- Expects system design interview (needs prep on distributed systems patterns)
- Large codebase maintenance vs. greenfield development

#### [LOW FIT] ROLES (STOP and warn user)
- **DevOps/Platform Engineer** - Protocol-heavy, CI/CD pipeline focus
- **Staff/Principal Engineer (FAANG)** - Requires specific pedigree, leetcode focus
- **Enterprise Test Engineer** - Formal testing methodologies, QA process focus
- **Data Scientist/ML Engineer** - Requires math/statistics background, not application development
- **Site Reliability Engineer (SRE)** - Infrastructure focus, on-call rotations

**LOW FIT red flags:**
- Heavy emphasis on CI/CD pipelines, Jenkins, Kubernetes, Terraform
- Requires extensive system design interview prep (distributed consensus, sharding, etc.)
- Focuses on process over product ("Agile ceremonies," "sprint planning," "retrospectives")
- Expects memorization of protocols vs. problem-solving
- Infrastructure/DevOps focused vs. application development
- On-call rotations or 24/7 production support
- Requires specific FAANG company experience or credentials

### Step 3: Decision & User Warning

Based on evaluation:

**If HIGH FIT:**
- [OK] Proceed with application work
- Briefly confirm the match (1-2 sentences)
- Continue with requested task (resume tailoring, interview prep, etc.)

**If MEDIUM FIT:**
- [WARNING] Warn user about gaps and prep requirements
- List specific areas needing preparation (e.g., "Requires formal Agile experience, system design interview prep")
- Estimate prep time needed (days/weeks)
- Ask: "This role requires significant preparation in [X, Y, Z]. Do you want to proceed, or should we find a better-fit opportunity?"
- **WAIT for explicit user confirmation before proceeding**

**If LOW FIT:**
- [STOP] **STOP immediately**
- Present clear warning with specific mismatches
- Explain why this role is problematic for user's profile
- Recommend alternative role types that would be better fits
- Ask: "This role has significant mismatches with your strengths [list specific issues]. I strongly recommend targeting [alternative roles] instead. Are you sure you want to proceed with this application?"
- **WAIT for explicit "yes, proceed anyway" before continuing**

## Warning Message Template

When role is MEDIUM or LOW FIT, use this structure:

```
*** JOB FIT WARNING ***

Role: [Job Title] at [Company]
Fit Level: [MEDIUM/LOW]

Key Mismatches:
- [Specific issue 1, e.g., "Requires extensive CI/CD pipeline experience"]
- [Specific issue 2, e.g., "FAANG-style system design interviews expected"]
- [Specific issue 3, e.g., "Heavy DevOps focus, not application development"]

Your Strengths Being Underutilized:
- [Strength 1, e.g., "AI/LLM application expertise"]
- [Strength 2, e.g., "Rapid prototyping and creative problem-solving"]

Recommended Alternative Roles:
- [Better fit 1]
- [Better fit 2]

Estimated Prep Time (if proceeding): [X days/weeks for specific topics]

Do you want to proceed with this application, or explore better-fit opportunities?
```

## User Profile Reference

### Core Strengths
- **Self-directed builder**: 4 production Next.js apps (AI Beats, Blockarized, Keyvex, TenantArmor)
- **AI/LLM expertise**: Multi-agent orchestration (Ajantic), RAG (Blockarized), cost optimization (81% reduction)
- **Real-time systems**: Sub-10ms audio latency (AI Beats), browser-based DSP
- **Enterprise credibility**: 6 years Fortune 500 (Fidelity National Financial)
- **Unique background**: Grammy-nominated producer to enterprise automation to AI systems

### Known Gaps
- **Formal protocols**: Limited experience with formal CI/CD, Agile ceremonies, sprint planning
- **Team collaboration**: Primarily solo developer, adapts to teams but not extensive recent experience
- **System design interviews**: Can design systems, but lacks FAANG-style interview prep
- **Infrastructure/DevOps**: Uses tools (GitHub Actions, Vercel) but not deep platform engineering

### Career Stage
- Completing Bachelor's IT (Associate's earned 2026)
- 20+ years hands-on experience (music production to enterprise to AI)
- Seeking roles valuing innovation and implementation over formal credentials

## Critical Rules

1. **Always evaluate BEFORE starting application work** - Don't tailor resumes or prep interviews for mismatched roles
2. **Be direct about mismatches** - User prefers honest assessment over wasted effort
3. **Wait for explicit confirmation** - Never proceed past MEDIUM/LOW fit warnings without user approval
4. **Suggest alternatives** - Always recommend better-fit role types when warning about mismatches
5. **Consider user's notes** - Check `MY_NOTES.txt` files for current energy/mood before suggesting difficult applications

## Examples

### Example 1: HIGH FIT (Proceed)

**Job:** "Senior AI Applications Engineer - Build LLM-powered products, Next.js stack, small team"

**Evaluation:**
[HIGH FIT] - AI/LLM focus matches Ajantic/Blockarized expertise, Next.js is user's primary stack, small team environment aligns with solo developer background.

**Action:** Proceed with resume tailoring, emphasizing Ajantic framework and Blockarized cost optimization.

---

### Example 2: MEDIUM FIT (Warn)

**Job:** "Senior Full-Stack Engineer - Large team, Agile ceremonies, pair programming expected, system design interviews"

**Evaluation:**
[MEDIUM FIT] - Tech stack matches, but formal Agile experience limited, pair programming is new, needs system design interview prep.

**Action:**
```
*** JOB FIT WARNING ***

Role: Senior Full-Stack Engineer at [Company]
Fit Level: MEDIUM

Key Gaps:
- Formal Agile/Scrum experience (you're primarily solo developer)
- Pair programming expectations (limited recent experience)
- System design interview likely (needs 1-2 weeks prep)

Prep Requirements:
- Study formal Agile ceremonies and terminology (2-3 days)
- Practice system design problems (1-2 weeks)
- Prepare examples of team collaboration from Fidelity experience

Estimated Total Prep: 2-3 weeks

Your tech stack (Next.js, TypeScript, React) is a perfect match, but the team/process expectations need preparation. Proceed with this application?
```

**WAIT for user confirmation.**

---

### Example 3: LOW FIT (STOP)

**Job:** "Senior DevOps Engineer - CI/CD pipeline architecture, Kubernetes, Terraform, Jenkins, on-call rotation"

**Evaluation:**
[LOW FIT] - Infrastructure/DevOps focus (not application development), requires deep protocol knowledge user struggles with, on-call rotation doesn't match preferred work style.

**Action:**
```
*** JOB FIT WARNING ***

Role: Senior DevOps Engineer at [Company]
Fit Level: LOW

Key Mismatches:
- Infrastructure/platform focus (your strength is application development)
- Heavy CI/CD protocol requirements (Jenkins, Kubernetes, Terraform)
- On-call rotation expected (doesn't match your work style)
- Minimal coding/product building (you excel at building products)

Your Strengths Being Underutilized:
- AI/LLM application expertise (Ajantic, Blockarized)
- Next.js full-stack development (4 production apps)
- Creative problem-solving and rapid prototyping
- Real-time systems engineering (AI Beats)

Recommended Alternative Roles Instead:
- AI Applications Engineer (uses your LLM expertise)
- Solutions Architect (customer-facing, less protocol-heavy)
- Senior Full-Stack (Next.js focus, more coding)
- Developer Relations (technical + communication)

I strongly recommend NOT pursuing this role. It plays to your weaknesses (protocol memorization, infrastructure) rather than your strengths (building products, AI systems, problem-solving).

Are you sure you want to proceed with this application?
```

**WAIT for explicit "yes, proceed anyway" before continuing.**

---

## Integration with Existing Workflows

After completing job fit evaluation and receiving user approval (if needed):

1. **For resume tailoring**: Proceed to modify appropriate resume from `JOB/` directory
2. **For interview prep**: Load `Interview_Cheat_Sheet.md` and create role-specific prep materials
3. **For application strategy**: Reference `Gemini_Convo.md` for career narrative, project reports for technical details

Always start with this skill FIRST when job-related work is requested.
