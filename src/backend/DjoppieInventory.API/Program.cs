using System.Threading.RateLimiting;
using DjoppieInventory.API.Extensions;
using DjoppieInventory.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Azure Key Vault (Production only)
// Secrets from Key Vault will override appsettings.json values
builder.Configuration.AddAzureKeyVaultConfiguration(builder.Environment);

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

// Configure Rate Limiting (Security: Prevent brute force and DDoS attacks)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global rate limit: 100 requests per minute per IP
    options.AddPolicy("fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            }));

    // Stricter limit for Intune/Graph API calls: 20 requests per minute per IP
    options.AddPolicy("intune", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            }));

    // Stricter limit for bulk operations: 5 requests per minute per IP
    options.AddPolicy("bulk", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = retryAfter.TotalSeconds.ToString();
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            error = "Too many requests. Please try again later.",
            statusCode = 429,
            retryAfterSeconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry)
                ? (int)retry.TotalSeconds
                : 60
        }, cancellationToken);
    };
});

// Validate required secrets are present (Production only)
builder.Services.ValidateRequiredSecrets(builder.Configuration, builder.Environment);

// Configure Health Checks
builder.Services.AddHealthCheckServices(builder.Configuration);

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

// Correlation ID middleware (must be first to ensure all logs have correlation ID)
app.UseCorrelationId();

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

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map health check endpoints
app.MapHealthCheckEndpoints();

// Ensure database is ready
app.EnsureDatabaseReady();

app.Run();
