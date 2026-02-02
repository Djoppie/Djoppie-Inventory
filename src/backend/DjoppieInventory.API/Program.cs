using DjoppieInventory.API.Extensions;
using DjoppieInventory.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Azure Key Vault for secure configuration management
// Must be called early in the pipeline, before other services that depend on secrets
builder.AddAzureKeyVault();

// Validate that all required secrets are available (from Key Vault or appsettings)
// This prevents the application from starting with missing critical configuration
if (!builder.Environment.IsDevelopment())
{
    builder.Configuration.ValidateRequiredSecrets(
        "AzureAd:ClientSecret",
        "ConnectionStrings:DefaultConnection"
    );
}

// Configure Application Insights
builder.Services.AddApplicationInsightsTelemetry();

// Add services to the container
builder.Services.AddControllers();

// Configure Authentication and Authorization with Microsoft Entra ID
builder.Services.AddEntraIdAuthentication(builder.Configuration);

// Configure Database
builder.Services.AddDatabaseConfiguration(builder.Configuration, builder.Environment);

// Configure Application Services (Repositories, Services, AutoMapper, Validation)
builder.Services.AddApplicationServices();

// Configure CORS
builder.Services.AddCorsConfiguration(builder.Configuration, builder.Environment);

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Djoppie Inventory API",
        Version = "v1",
        Description = "Asset and Inventory Management System with Microsoft Intune Integration",
        Contact = new() { Name = "Djoppie Team", Email = "jo.wijnen@diepenbeek.be" }
    });

    // Add JWT Bearer authentication to Swagger
    c.AddSecurityDefinition("oauth2", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.OAuth2,
        Flows = new Microsoft.OpenApi.Models.OpenApiOAuthFlows
        {
            AuthorizationCode = new Microsoft.OpenApi.Models.OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/authorize"),
                TokenUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string>
                {
                    { builder.Configuration["AzureAd:Audience"] + "/access_as_user", "Access the API as a user" }
                }
            }
        }
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "oauth2"
                }
            },
            new[] { builder.Configuration["AzureAd:Audience"] + "/access_as_user" }
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline

// Global exception handling middleware (must be early in pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Djoppie Inventory API v1");
        c.OAuthClientId(builder.Configuration["AzureAd:ClientId"]);
        c.OAuthUsePkce();
        c.OAuthScopeSeparator(" ");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is ready
app.EnsureDatabaseReady();

app.Run();
