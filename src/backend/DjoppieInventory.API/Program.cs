using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using DjoppieInventory.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Configure Application Insights
builder.Services.AddApplicationInsightsTelemetry();

// Add services to the container
builder.Services.AddControllers();

// Configure Authentication with Microsoft Entra ID
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// Configure Database - Use SQL Server in production, SQLite in development
if (builder.Environment.IsProduction())
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlServerOptionsAction: sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(
            builder.Configuration.GetConnectionString("DefaultConnection") ??
            "Data Source=djoppie.db"));
}

// Register Repositories
builder.Services.AddScoped<IAssetRepository, AssetRepository>();
builder.Services.AddScoped<IAssetTemplateRepository, AssetTemplateRepository>();

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsProduction())
        {
            var allowedOrigins = builder.Configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
                ?? new[] { "https://lemon-glacier-041730903.1.azurestaticapps.net" };

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Djoppie Inventory API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Djoppie Inventory API v1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply database migrations automatically in production (optional via environment variable)
if (app.Environment.IsProduction())
{
    var autoMigrate = builder.Configuration.GetValue<bool>("Database:AutoMigrate", false);
    if (autoMigrate)
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

            try
            {
                logger.LogInformation("Applying database migrations...");
                db.Database.Migrate();
                logger.LogInformation("Database migrations applied successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while migrating the database.");
                // Don't throw - let the app start even if migration fails
                logger.LogWarning("Application will start without migrations. Please run migrations manually.");
            }
        }
    }
}
else
{
    // Ensure database is created in development
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureCreated();
    }
}

app.Run();
