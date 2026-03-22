using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Repositories;
using DjoppieInventory.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;

namespace DjoppieInventory.API.Extensions;

/// <summary>
/// Extension methods for configuring application services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds application services (repositories and business logic services)
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Register Repositories
        services.AddScoped<IAssetRepository, AssetRepository>();
        services.AddScoped<IAssetTemplateRepository, AssetTemplateRepository>();
        services.AddScoped<IAssetTypeRepository, AssetTypeRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IBuildingRepository, BuildingRepository>();
        services.AddScoped<ISectorRepository, SectorRepository>();
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IAssetEventRepository, AssetEventRepository>();
        services.AddScoped<ILeaseContractRepository, LeaseContractRepository>();
        services.AddScoped<IRolloutRepository, RolloutRepository>();

        // Register Services
        services.AddScoped<IAssetService, AssetService>();
        services.AddScoped<IAssetEventService, AssetEventService>();
        services.AddScoped<ICsvImportService, CsvImportService>();
        services.AddScoped<IIntuneService, IntuneService>();
        services.AddScoped<IGraphUserService, GraphUserService>();
        services.AddScoped<IAssetCodeGenerator, AssetCodeGeneratorService>();
        services.AddScoped<IRolloutWorkplaceService, RolloutWorkplaceService>();

        // Rollout Feature Redesign Services
        services.AddScoped<IOrganizationSyncService, OrganizationSyncService>();
        services.AddScoped<IAssetMovementService, AssetMovementService>();
        services.AddScoped<IWorkplaceAssetAssignmentService, WorkplaceAssetAssignmentService>();

        // Device Deployment Services (Laptop Swap / Onboarding)
        services.AddScoped<IDeploymentService, DeploymentService>();

        // Configure AutoMapper (v13+ API - AddAutoMapper is now in core package)
        services.AddAutoMapper(cfg => { }, typeof(Profiles.MappingProfile).Assembly);

        // Add FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<DjoppieInventory.Core.Validators.CreateAssetDtoValidator>();

        return services;
    }
}
