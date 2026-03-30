# Feature Development Task

Template for developing new features across the full stack.

## Workflow

### 1. Planning
- [ ] Review requirements
- [ ] Identify affected layers (frontend/backend/database)
- [ ] Design API contract
- [ ] Break down into subtasks

### 2. Backend Implementation
- [ ] Create/update entity in `Core/Entities/`
- [ ] Add DTOs in `Core/DTOs/`
- [ ] Create migration if needed
- [ ] Implement controller endpoints
- [ ] Add unit tests

### 3. Frontend Implementation
- [ ] Add TypeScript types in `types/`
- [ ] Create API functions in `api/`
- [ ] Implement React hooks in `hooks/`
- [ ] Build components in `components/`
- [ ] Create/update pages

### 4. Integration
- [ ] Test API integration
- [ ] Verify cache invalidation
- [ ] Test error handling
- [ ] Check loading states

### 5. Finalization
- [ ] Run linter (`npm run lint`)
- [ ] Build frontend (`npm run build`)
- [ ] Run tests (`dotnet test`)
- [ ] Update documentation if needed

## Commands

```bash
# Backend
dotnet run                                    # Run API
dotnet ef migrations add <Name> --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API
dotnet ef database update --project DjoppieInventory.Infrastructure --startup-project DjoppieInventory.API

# Frontend
npm run dev                                   # Run dev server
npm run build                                 # Build
npm run lint                                  # Lint
```
