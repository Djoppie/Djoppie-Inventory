# DjoppieInventory Test Suite

## Overview

This test project contains comprehensive unit tests, integration tests, and test fixtures for the Djoppie Inventory management system, with a focus on the Rollout Feature Redesign.

## Quick Start

### Prerequisites
- .NET 8.0 SDK
- Visual Studio 2022 or VS Code (optional)

### Running Tests

```bash
# Navigate to test directory
cd src/backend/DjoppieInventory.Tests

# Restore dependencies
dotnet restore

# Run all tests
dotnet test

# Run with detailed output
dotnet test --logger "console;verbosity=detailed"

# Run with code coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Test Structure

```
DjoppieInventory.Tests/
├── Helpers/                 # Test utilities and validators
├── Services/                # Service layer unit tests
├── Integration/             # API integration tests
├── Fixtures/                # Reusable test data generators
├── DTOs/                    # DTO validation tests
└── TEST-SUITE-SUMMARY.md   # Detailed test documentation
```

## Running Specific Test Categories

### Run Service Tests Only
```bash
dotnet test --filter "FullyQualifiedName~Services"
```

### Run Integration Tests Only
```bash
dotnet test --filter "FullyQualifiedName~Integration"
```

### Run Specific Test Class
```bash
dotnet test --filter "FullyQualifiedName~AssetMovementServiceTests"
dotnet test --filter "FullyQualifiedName~WorkplaceAssetAssignmentServiceTests"
```

### Run Single Test Method
```bash
dotnet test --filter "FullyQualifiedName~AssetMovementServiceTests.RecordDeploymentAsync_ValidRequest_CreatesMovementAndUpdatesAsset"
```

## Test Frameworks and Libraries

- **xUnit 2.9.3** - Test framework
- **Moq 4.20.70** - Mocking framework
- **FluentAssertions 6.12.0** - Fluent assertions
- **Microsoft.EntityFrameworkCore.InMemory 8.0.0** - In-memory database
- **coverlet.collector 6.0.4** - Code coverage

## Key Test Files

### Service Tests
- `Services/AssetMovementServiceTests.cs` - Tests for asset movement tracking (21 tests)
- `Services/WorkplaceAssetAssignmentServiceTests.cs` - Tests for workplace assignments (18 tests)

### Integration Tests
- `Integration/RolloutWorkplacesControllerTests.cs` - API endpoint tests (8 tests)

### Test Helpers
- `Helpers/TestDbContextFactory.cs` - In-memory database factory
- `Fixtures/RolloutTestFixture.cs` - Test data generation helpers
- `Fixtures/RolloutTestFixtureTests.cs` - Fixture validation tests

## Writing New Tests

### Example Unit Test

```csharp
using DjoppieInventory.Tests.Helpers;
using FluentAssertions;

public class MyServiceTests
{
    [Fact]
    public async Task MyMethod_ValidInput_ReturnsExpectedResult()
    {
        // Arrange
        await using var context = TestDbContextFactory.CreateInMemoryContext();
        var service = new MyService(context);

        // Act
        var result = await service.MyMethod();

        // Assert
        result.Should().NotBeNull();
        result.Value.Should().Be("expected");
    }
}
```

### Example Integration Test

```csharp
public class MyControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MyControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetEndpoint_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/api/my-endpoint");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

## Test Data Management

### Using Test Fixtures

The `RolloutTestFixture` class provides helper methods for creating test data:

```csharp
await using var context = TestDbContextFactory.CreateInMemoryContext();

// Create complete test scenario
var scenario = await RolloutTestFixture.CreateCompleteScenarioAsync(context);

// Access created entities
var session = scenario.Session;
var workplaces = scenario.Workplaces;
var assets = scenario.Assets;
```

### Create Specific Test Data

```csharp
// Create asset types
var assetTypes = await RolloutTestFixture.CreateAssetTypesAsync(context);

// Create assets
var assets = await RolloutTestFixture.CreateAssetsAsync(
    context,
    assetTypeId: 1,
    count: 10,
    status: AssetStatus.Nieuw);

// Create full session with days and workplaces
var session = await RolloutTestFixture.CreateFullSessionAsync(
    context,
    dayCount: 3,
    workplacesPerDay: 2);
```

## Code Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Install report generator (one-time)
dotnet tool install -g dotnet-reportgenerator-globaltool

# Generate HTML report
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:"coveragereport" -reporttypes:Html

# Open report
start coveragereport/index.html  # Windows
open coveragereport/index.html   # macOS
```

### Current Coverage Goals
- Service Layer: >90%
- API Controllers: >80%
- Critical Business Logic: 100%

## Testing Best Practices

### 1. Test Naming Convention
```csharp
MethodName_Scenario_ExpectedResult
```
Example: `RecordDeploymentAsync_ValidRequest_CreatesMovementAndUpdatesAsset`

### 2. Arrange-Act-Assert Pattern
Always structure tests in three clear sections:
```csharp
// Arrange - Set up test data and dependencies
var context = TestDbContextFactory.CreateInMemoryContext();

// Act - Execute the method under test
var result = await service.Method();

// Assert - Verify the expected outcome
result.Should().NotBeNull();
```

### 3. Test Isolation
Each test should be completely independent:
- Use unique in-memory database per test
- Don't rely on test execution order
- Clean up resources in Dispose() if needed

### 4. Fluent Assertions
Use FluentAssertions for readable tests:
```csharp
// Good
result.Should().NotBeNull();
result.Items.Should().HaveCount(5);
result.Status.Should().Be(AssetStatus.InGebruik);

// Avoid
Assert.NotNull(result);
Assert.Equal(5, result.Items.Count);
```

### 5. Mock External Dependencies
```csharp
var mockService = new Mock<IExternalService>();
mockService
    .Setup(s => s.GetData())
    .ReturnsAsync(testData);
```

## Troubleshooting

### Tests Fail to Build
```bash
# Clean and restore
dotnet clean
dotnet restore
dotnet build
```

### In-Memory Database Issues
If tests interfere with each other:
- Ensure each test creates its own context
- Check for static state or shared resources
- Use unique database names if needed:
  ```csharp
  TestDbContextFactory.CreateInMemoryContext("UniqueDbName")
  ```

### Mock Setup Not Working
- Verify interface methods match exactly
- Check parameter matchers: `It.IsAny<T>()` vs specific values
- Ensure mock is properly injected into service

## Continuous Integration

These tests are designed for CI/CD pipelines:

### Azure DevOps
```yaml
- task: DotNetCoreCLI@2
  displayName: 'Run Tests'
  inputs:
    command: test
    projects: 'src/backend/DjoppieInventory.Tests/DjoppieInventory.Tests.csproj'
    arguments: '--configuration Release --collect:"XPlat Code Coverage"'
```

### GitHub Actions
```yaml
- name: Run tests
  run: dotnet test --configuration Release --collect:"XPlat Code Coverage"
  working-directory: src/backend/DjoppieInventory.Tests
```

## Test Metrics

Current test suite statistics:
- **Total Tests**: 51+
- **Service Tests**: 39
- **Integration Tests**: 8
- **Fixture Tests**: 4
- **Average Execution Time**: <5 seconds for full suite

## Additional Resources

- [TEST-SUITE-SUMMARY.md](./TEST-SUITE-SUMMARY.md) - Detailed test documentation
- [xUnit Documentation](https://xunit.net/)
- [Moq Documentation](https://github.com/moq/moq4)
- [FluentAssertions Documentation](https://fluentassertions.com/)

## Contributing

When adding new tests:
1. Follow the existing test structure and naming conventions
2. Add tests for both happy path and edge cases
3. Use test fixtures for common data setup
4. Ensure tests are fast and isolated
5. Document complex test scenarios
6. Update TEST-SUITE-SUMMARY.md if adding new test categories

## Support

For questions or issues:
- Review TEST-SUITE-SUMMARY.md for detailed coverage information
- Check existing tests for examples
- Refer to CLAUDE.md for project-specific patterns
