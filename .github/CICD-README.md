# PumpGuard Pro - CI/CD Pipeline Documentation

## Overview
This CI/CD pipeline implements automated testing, building, and deployment for the PumpGuard Pro industrial maintenance system using GitHub Actions.

## Pipeline Structure

### 1. Backend Pipeline (`.github/workflows/backend.yml`)
- **Triggers**: Push to `main`/`develop`, PR to `main`/`develop`, backend file changes
- **Jobs**:
  - **Test**: Unit tests, coverage check (>60%), linting
  - **Build**: TypeScript compilation, Prisma generation
  - **Deploy Staging**: Railway deployment on `develop` branch
  - **Deploy Production**: Railway deployment on `main` branch

### 2. Frontend Pipeline (`.github/workflows/frontend.yml`)
- **Triggers**: Push to `main`/`develop`, PR to `main`/`develop`, frontend file changes
- **Jobs**:
  - **Test**: Unit tests, coverage check (>60%), type checking, linting
  - **Build**: Next.js build optimization
  - **Lighthouse**: Performance and accessibility audit
  - **Deploy Staging**: Vercel deployment on `develop` branch
  - **Deploy Production**: Vercel deployment on `main` branch
  - **E2E Tests**: End-to-end testing on staging
  - **Security Scan**: Vulnerability scanning

### 3. Integration Pipeline (`.github/workflows/integration.yml`)
- **Triggers**: Push to branches, PRs, daily schedule
- **Jobs**:
  - **Integration Tests**: Full system testing with real database
  - **Performance Tests**: Load testing with k6

## Environment Strategy

### Staging Environment
- **Branch**: `develop`
- **Backend**: Railway staging service
- **Frontend**: Vercel preview deployment
- **Database**: Staging PostgreSQL instance
- **Purpose**: Testing and validation before production

### Production Environment
- **Branch**: `main`
- **Backend**: Railway production service
- **Frontend**: Vercel production deployment
- **Database**: Production PostgreSQL instance
- **Purpose**: Live system serving end users

## Security & Quality Gates

### Test Coverage Requirements
- Minimum 60% coverage for all services
- Unit tests must pass before deployment
- Integration tests validate full system functionality

### Security Measures
- Snyk vulnerability scanning
- npm audit for dependency security
- Secure environment variable management
- No secrets in source code

### Quality Checks
- ESLint for code quality
- TypeScript type checking
- Lighthouse performance audits
- E2E test validation

## Deployment Process

### Automatic Deployments
1. **Staging**: Every push to `develop` branch
2. **Production**: Every push to `main` branch

### Manual Deployments
- Can be triggered via GitHub Actions UI
- Environment protection rules require approval for production

### Rollback Strategy
- Railway provides instant rollback capabilities
- Vercel maintains deployment history for quick reversion
- Database migrations use Prisma's migration system

## Monitoring & Notifications

### Health Checks
- Backend: `/health` endpoint validation
- Frontend: Application accessibility check
- Database: Connection and query validation

### Failure Notifications
- GitHub Actions built-in notifications
- Deployment status updates
- Coverage report integration

## Required Secrets Configuration

### GitHub Repository Secrets
```
# Railway (Backend)
RAILWAY_TOKEN
BACKEND_PRODUCTION_URL
BACKEND_STAGING_URL

# Vercel (Frontend)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Environment URLs
NEXT_PUBLIC_API_URL_PRODUCTION
NEXT_PUBLIC_API_URL_STAGING

# Security
SNYK_TOKEN
LHCI_GITHUB_APP_TOKEN
```

### Railway Environment Variables
```
# Production
DATABASE_URL
JWT_SECRET
NODE_ENV=production
PORT=3001
CORS_ORIGIN

# Staging
DATABASE_URL
JWT_SECRET
NODE_ENV=staging
PORT=3001
CORS_ORIGIN
```

### Vercel Environment Variables
```
# Production
NEXT_PUBLIC_API_URL
NODE_ENV=production

# Staging
NEXT_PUBLIC_API_URL
NODE_ENV=staging
```

## Performance Optimization

### Build Optimization
- npm cache utilization
- Dependency caching between runs
- Parallel job execution where possible
- Artifact sharing between jobs

### Test Optimization
- Test parallelization
- Smart test selection based on changed files
- Database connection pooling for integration tests

## Maintenance

### Regular Updates
- Dependency updates via automated PRs
- Security patch management
- Performance monitoring and optimization

### Monitoring
- Build time tracking
- Deployment success rates
- Test coverage trends
- Performance metrics