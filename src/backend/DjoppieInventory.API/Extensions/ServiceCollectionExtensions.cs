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

        // Register Services
        services.AddScoped<IAssetService, AssetService>();
        services.AddScoped<IIntuneService, IntuneService>();

        // Configure AutoMapper
        services.AddAutoMapper(typeof(Program).Assembly);

        // Add FluentValidation
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<DjoppieInventory.Core.Validators.CreateAssetDtoValidator>();

        return services;
    }
}
