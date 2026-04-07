# DevOps Report - CSP Group 4

## 1. Project Overview

- **Project type:** Full-stack web application  
- **Backend:** ASP.NET Core (`server/tmsserver`)  
- **Frontend:** React + Vite (`client/tmsclient`)  
- **Target platform:** Azure App Service (backend) + Azure Static Web Apps (frontend)  

This DevOps implementation focuses on deployment stability, secure configuration, environment separation, and rollback safety.

---

## 2. DevOps Objectives

The following objectives were implemented:

1. Reliable deployments
2. Proper environment management (Development vs Production)
3. Secure configuration (no hardcoded secrets)
4. Easy rollback mechanism
5. Automated CI/CD deployment pipeline

---

## 3. Environment Configuration

### Backend configuration strategy

Backend configuration now follows standard ASP.NET Core patterns:

- `appsettings.json` for common non-secret defaults
- `appsettings.Development.json` for development overrides
- `appsettings.Production.json` for production template values
- Environment variables for secrets and runtime-sensitive values

### Secret handling

Sensitive values are no longer hardcoded in tracked config files.

Used environment variables include:

- `ConnectionStrings__DefaultConnection` (recommended)
- `AZURE_SQL_CONNECTIONSTRING` (fallback support)
- `JWT__KEY`
- `Cors__AllowedOrigins__0` (and additional indexed entries)

### Files updated

- `server/tmsserver/Program.cs`
- `server/tmsserver/appsettings.json`
- `server/tmsserver/appsettings.Development.json`
- `server/tmsserver/appsettings.Production.json` (added)
- `server/tmsserver/.env.example` (added, local template only)

---

## 4. Backend Runtime Stability Changes

`Program.cs` now:

- Loads `.env` only in **Development**
- Reads connection string in safe order:
  1. `ConnectionStrings:DefaultConnection`
  2. `AZURE_SQL_CONNECTIONSTRING`
- Validates required JWT signing key (`Jwt:Key`)
- Fails fast with clear startup messages if critical config is missing
- Reads CORS allowed origins from config with sensible defaults

This reduces production misconfiguration risk and avoids silent failures.

---

## 5. Frontend Configuration

Frontend now uses centralized environment-driven API base URL:

- `client/tmsclient/src/config/api.js`
- `API_BASE_URL = import.meta.env.VITE_API_URL || '/api'`

Benefits:

- Separate dev/prod API URLs
- Cleaner deployment portability
- Works with proxy/same-origin routing when applicable

Related service usage was aligned to this central config.

---

## 6. CI/CD Pipeline

### Workflow implemented

- **File:** `.github/workflows/deploy-azure.yml`

### Pipeline stages

1. **Backend build + publish**
2. **Deploy backend to staging slot**
3. **Frontend build + deploy**
4. **Swap staging -> production**

### Required GitHub Secrets

- `AZURE_WEBAPP_NAME`
- `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING`
- `AZURE_RESOURCE_GROUP`
- `AZURE_CREDENTIALS`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `VITE_API_URL`

---

## 7. Azure Deployment Stability Design

### Deployment slots

Backend uses Azure App Service slots:

- `staging`
- `production`

### Safe deployment flow

1. Deploy new backend version to `staging`
2. Validate staging environment (smoke checks)
3. Swap `staging` -> `production`

### Rollback strategy

If production issues appear, rollback is immediate via reverse slot swap:

- Swap `production` and `staging` again to restore previous stable version

This minimizes downtime and deployment risk.

---

## 8. Validation and Evidence

### Test status (frontend)

Latest verified run:

- **Test Files:** 27 passed (27)
- **Tests:** 71 passed (71)
- **Errors:** 0

### Coverage status (frontend)

Generated with `npm run coverage`:

- **Statements:** 74.9%
- **Branches:** 58.69%
- **Functions:** 57.14%
- **Lines:** 74.9%

Coverage artifacts:

- `client/tmsclient/coverage/index.html`
- `client/tmsclient/coverage/lcov.info`
- `client/tmsclient/coverage/cobertura-coverage.xml`
- `client/tmsclient/coverage-summary.txt`

---

## 9. Commands Used for Verification

### Frontend

```bash
cd client/tmsclient
npm test
npm run coverage
npm run build
```

### Backend

```bash
dotnet build "server/tmsserver/tmsserver.csproj" -c Release
dotnet test "server/tmsserver/cspbackend.sln"
```

---

## 10. Challenges and Fixes

1. **API base URL changes broke tests**  
   - Cause: moving from hardcoded localhost URLs to env-based `/api`.
   - Fix: updated test expectations and mocks accordingly.

2. **Brittle UI test queries**  
   - Cause: exact text selectors failed when rendered structure changed.
   - Fix: replaced with role-based or resilient selectors.

3. **NuGet vulnerability and version conflicts**  
   - Cause: transitive package vulnerabilities and JWT version mismatch.
   - Fix: update conflicting package references and align versions.

---

## 11. Outcome

The project now has a practical DevOps foundation suitable for a university production-style workflow:

- Environment-separated configuration
- Removed hardcoded sensitive values
- CI/CD deployment automation
- Staging-first releases
- Fast rollback via slot swap
- Verified tests and coverage artifacts

---

## 12. Rubric Mapping (Implemented vs Pending)

This section maps the current project state to the requested DevOps rubric items.

### A) Implement Monitoring & Logging (8) - **Partially Implemented**

**Implemented**
- ASP.NET Core logging pipeline is active through `appsettings*.json`.
- Runtime warnings/errors are visible in backend and frontend test/runtime outputs.

**Not fully implemented yet**
- Centralized observability (e.g., Azure Application Insights, Log Analytics workspace).
- Alert rules (error rate, response time, health).
- Custom operational dashboards and telemetry queries.

### B) Improve Dashboard & Visualization Performance (5) - **Not Implemented (as a dedicated task)**

**Current status**
- No dedicated performance optimization package was implemented for dashboard-heavy UI components.
- No formal before/after performance benchmark was captured (Lighthouse/Web Vitals/profiling report).

**Scope note**
- Current work focused on deployment stability and configuration hardening, not UI performance tuning.

### C) Maintain Deployment Stability (3) - **Implemented**

**Implemented**
- Environment separation for backend (`appsettings.json`, `appsettings.Development.json`, `appsettings.Production.json`).
- Secure secret handling via env vars (connection string, JWT key).
- Startup safety checks in backend config loading (clear fail-fast when missing critical settings).
- Frontend API endpoint configuration via Vite env (`VITE_API_URL`).
- CI/CD deployment workflow using staging-first strategy and slot swap.
- Rollback path via reverse slot swap.

### D) Implement Database Backup & Recovery Strategy (3) - **Not Implemented in repository automation**

**Current status**
- No repository-level backup automation script/runbook was implemented.
- No scheduled backup verification/restore drill evidence committed.

**Platform note**
- For Azure SQL, backups are platform-managed (PITR/LTR), but formal project-level backup/recovery procedure and proof should still be documented and tested.

### Summary

- **Fully implemented:** Deployment Stability  
- **Partially implemented:** Monitoring & Logging  
- **Pending:** Dashboard Performance, Backup & Recovery strategy

