# PowerApp

TODO: Add app description

## Table of Contents

- [Application Architecture](#application-architecture)
- [Local Development](#local-development)
- [App Structure](#app-structure)
- [Preferences](#preferences)
- [Deployment](#deployment)

## Application Architecture

- **Frontend**: Next.js 16 with React 19
- **Backend**: AWS Lambda functions via SST
- **API**: AWS API Gateway V2
- **Infrastructure**: AWS (managed by SST)
- **Styling**: Tailwind CSS with Radix UI components

## Local Development

### Prerequisites
- Node.js 20+
- AWS CLI configured
- SST CLI

### Setup
```bash
npm install
```

### Start Development Server
```bash
npx sst dev
```

## App Structure

```
powerapp/
├── app/                    # Next.js app directory
├── backend/               # Lambda functions
│   └── functions/         # API handlers
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                  # Utilities
└── sst.config.ts         # Infrastructure config
```

## Preferences

- **Code Style**: ESLint + TypeScript
- **Commits**: Conventional commits with semantic-release
- **Deployment**: Automatic via GitHub Actions
- **Environments**: Development and Production stages

## Deployment

### Development
Push to `development` branch for automatic deployment to dev environment.

### Production
Push to `main` branch with conventional commits:
- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `refactor:` - Code refactoring (patch version bump)
- `improve:` - Improvements (patch version bump)
- `chore:` - Maintenance (patch version bump)