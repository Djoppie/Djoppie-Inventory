# Bug Fix Task

Template for investigating and fixing bugs.

## Workflow

### 1. Reproduce
- [ ] Understand the bug from description/screenshot
- [ ] Identify affected component/endpoint
- [ ] Reproduce locally if possible

### 2. Investigate
- [ ] Check browser console for errors
- [ ] Check network requests
- [ ] Check backend logs
- [ ] Trace code path

### 3. Fix
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Test fix locally

### 4. Verify
- [ ] Test original scenario
- [ ] Test related scenarios
- [ ] Run linter and build
- [ ] Run tests if affected

## Common Issues

### React Query Cache
If UI doesn't update after mutations:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['affected-key'] });
}
```

### 401 Unauthorized
- Clear browser cache
- Check `VITE_ENTRA_API_SCOPE` matches backend
- Verify token scopes

### Database Errors
- Run `dotnet ef database update`
- Check migration compatibility (SQLite vs SQL Server)

### Build Failures
- Check TypeScript errors: `npx tsc --noEmit`
- Check lint errors: `npm run lint`
