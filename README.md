# PG Connect

PG Connect is a multi-tenant community and grievance-management web application designed for residents of PG (Paying Guest) accommodations and property owners/wardens.

## Workspace Structure

- `apps/api`: Node.js + Express + TypeScript + Prisma ORM REST API.
- `apps/web`: React + Vite + TypeScript + Tailwind CSS Frontend SPA.
- `infra/terraform`: Infrastructure as Code for AWS (VPC, ALB, ECS Fargate, RDS PostgreSQL, S3, SES).
- `.github/workflows`: Automated CI/CD pipeline.

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Backend Setup (`apps/api`)
```bash
# Setup database schema
npm run build:api
npm run dev:api
```

### 3. Frontend Setup (`apps/web`)
```bash
npm run dev:web
```

### 4. Run Tests
```bash
npm test
```

## Security & Tenant Boundary Scoping
All requests touching property data strictly enforce `pgId` boundary isolation via the `withTenantScope` utility function on backend data services.
