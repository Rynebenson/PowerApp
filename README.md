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
│   ├── dynamo/           # DynamoDB helpers
│   └── entities/         # Data type definitions
└── sst.config.ts         # Infrastructure config
```

### Data Layer Architecture

**Single Table Design**: All data is stored in one DynamoDB table (`AppDataTable`) using a single-table design pattern with composite keys (pk/sk).

**Entities** (`lib/entities/`): TypeScript interfaces defining data structures
- `user.ts` - User, UserPreferences
- `org.ts` - Organization
- Import these types throughout the app for type safety

**DynamoDB Helpers** (`lib/dynamo/`): Abstraction layer for database operations
- `client.ts` - Shared DynamoDB client and table name
- `users.ts` - User-related CRUD operations (getUser, putUser, getUserPreferences, putUserPreferences)
- Backend handlers MUST use these helpers instead of direct DynamoDB calls
- Benefits: Centralized logic, easier testing, consistent error handling

## API Endpoints

### Handler Pattern
API handlers in `backend/functions/` use a single Lambda function per resource to handle multiple HTTP methods. This reduces cold starts and improves resource efficiency in AWS.

**Example**: `backend/functions/users/preferences.ts`
```typescript
export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const method = event.requestContext.http.method;
  
  switch (method) {
    case "GET":
      // Handle GET request
      break;
    
    case "PUT":
      // Handle PUT request
      break;
    
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
  }
};
```

**Benefits**:
- Single Lambda function handles multiple methods (GET, PUT, POST, DELETE)
- Reduces number of Lambda functions and cold starts
- Lower AWS costs and better performance
- Shared initialization code (DB clients, etc.)

**Route Configuration** in `sst.config.ts`:
```typescript
api.route("GET /users/preferences", "backend/functions/users/preferences.handler")
api.route("PUT /users/preferences", "backend/functions/users/preferences.handler")
```

## Preferences

- **Code Style**: ESLint + TypeScript
- **Commits**: Conventional commits with semantic-release
- **Deployment**: Automatic via GitHub Actions
- **Environments**: Development and Production stages
- **UI Components**: All components in `components/ui/` are managed by shadcn. Use `npx shadcn@latest add <component>` to add new components. DO NOT manually create or edit files in this directory.
- **Database Operations**: Always use helpers from `lib/dynamo/` in backend handlers. Never write direct DynamoDB commands in handlers.
- **Type Definitions**: Import entity types from `lib/entities/` for all data structures to ensure type safety across frontend and backend.

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