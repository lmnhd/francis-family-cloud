# Next.js 15 Configuration Reference

Configuration templates and patterns for Next.js 15 projects.

## Project Structure with AI Rules Files

```
project/
├── .cursor/
│   └── rules/
│       └── critical.md           # Cursor IDE rules
├── .windsurf/
│   └── rules/
│       └── critical.md           # Windsurf IDE rules
├── .agent/
│   └── rules/
│       └── critical.md           # Generic agent rules
├── .github/
│   └── copilot-instructions.md   # Master rules for all agents
├── CLAUDE.md                     # Claude Code instructions
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
├── .env.local
├── .gitignore
├── .next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PDR.md                        # Project Design Record
└── README.md
```

## next.config.ts Template

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbopack: true, // Enable Turbopack for faster builds
  },
  // Add custom configurations as needed
  webpack: (config, { isServer }) => {
    // Custom webpack configurations
    return config;
  },
};

export default nextConfig;
```

## tsconfig.json Template

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*", "app/*"]
    },
    "types": ["node", "jest", "@testing-library/jest-dom"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "app/**/*"],
  "exclude": ["node_modules"]
}
```

## tailwind.config.ts Template

```typescript
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

## package.json Base Dependencies

### Production Dependencies

```json
{
  "next": "^15.1.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "clsx": "^2.1.0",
  "zod": "^3.22.4"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.0.0",
  "@types/react-dom": "^18.0.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "autoprefixer": "^10.4.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "15.1.3",
  "postcss": "^8.4.0",
  "tailwindcss": "^4.0.0",
  "typescript": "^5.7.0"
}
```

## .env.local Template

```env
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# External APIs
OPENAI_API_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=

# Services
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Feature Flags
NEXT_PUBLIC_DEBUG=false
```

## .gitignore Patterns (Next.js)

```
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## Directory Structure Best Practices

### App Router Structure

```
app/
├── api/
│   ├── auth/
│   ├── users/
│   └── [other-routes]/
├── (features)/              # Route groups
│   ├── auth/
│   ├── dashboard/
│   └── [other-features]/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
└── not-found.tsx           # 404 handler

src/
├── lib/
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── db/                 # Database utilities
│   └── ai/                 # AI/LLM services
├── components/             # React components
├── server/                 # Server-only utilities
└── storage/                # Client-side storage

public/                      # Static assets
```

## Key Conventions for Next.js 15

1. **Use App Router** - Not Pages Router
2. **Server Components by Default** - Add `'use client'` only when needed
3. **API Routes** - Keep route handlers thin, move logic to `core-logic.ts`
4. **Type Safety** - Never use `any` types
5. **Separate Client/Server** - Be explicit about boundaries
6. **Testing** - Create test pages in `/tests/` directory for development

## Common Configuration Modifications

### Add TypeScript Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Enable Source Maps for Production Debugging

```typescript
const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
};
```

### Configure Image Optimization

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
};
```

## Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
