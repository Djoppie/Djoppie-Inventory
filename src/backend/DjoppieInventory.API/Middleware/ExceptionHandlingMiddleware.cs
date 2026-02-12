using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Middleware;

/// <summary>
/// Middleware for handling exceptions globally and returning consistent error responses.
/// In production, detailed error messages are hidden to prevent information leakage.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Get correlation ID from context (set by CorrelationIdMiddleware)
        var correlationId = context.Items["CorrelationId"]?.ToString()
            ?? context.Response.Headers["X-Correlation-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();

        var isDevelopment = _environment.IsDevelopment();

        // Map exception to status code and user-safe message
        var (statusCode, userMessage, detailMessage) = MapException(exception, isDevelopment);

        // Log the exception with correlation ID for tracing
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId,
            ["ExceptionType"] = exception.GetType().Name
        }))
        {
            if ((int)statusCode >= 500)
            {
                _logger.LogError(exception, "Server error [{CorrelationId}]: {Message}", correlationId, exception.Message);
            }
            else
            {
                _logger.LogWarning("Client error [{CorrelationId}]: {Message}", correlationId, exception.Message);
            }
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // Ensure correlation ID is in response headers
        if (!context.Response.Headers.ContainsKey("X-Correlation-ID"))
        {
            context.Response.Headers["X-Correlation-ID"] = correlationId;
        }

        // Build response - only include details in development
        var response = isDevelopment
            ? new
            {
                error = userMessage,
                detail = detailMessage,
                statusCode = (int)statusCode,
                correlationId,
                timestamp = DateTime.UtcNow,
                exceptionType = exception.GetType().Name,
                stackTrace = exception.StackTrace
            }
            : (object)new
            {
                error = userMessage,
                statusCode = (int)statusCode,
                correlationId,
                timestamp = DateTime.UtcNow
            };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static (HttpStatusCode statusCode, string userMessage, string detailMessage) MapException(
        Exception exception, bool includeDetails)
    {
        return exception switch
        {
            ArgumentNullException or ArgumentException =>
                (HttpStatusCode.BadRequest,
                 includeDetails ? exception.Message : "Invalid request parameters.",
                 exception.Message),

            KeyNotFoundException =>
                (HttpStatusCode.NotFound,
                 includeDetails ? exception.Message : "The requested resource was not found.",
                 exception.Message),

            InvalidOperationException when exception.Message.Contains("already exists") =>
                (HttpStatusCode.Conflict,
                 includeDetails ? exception.Message : "A conflict occurred with existing data.",
                 exception.Message),

            InvalidOperationException =>
                (HttpStatusCode.BadRequest,
                 includeDetails ? exception.Message : "The operation could not be completed.",
                 exception.Message),

            DbUpdateConcurrencyException =>
                (HttpStatusCode.Conflict,
                 "The resource was modified by another user. Please refresh and try again.",
                 exception.Message),

            DbUpdateException dbEx =>
                (HttpStatusCode.InternalServerError,
                 "A database error occurred while processing your request.",
                 dbEx.InnerException?.Message ?? dbEx.Message),

            AutoMapper.AutoMapperMappingException =>
                (HttpStatusCode.InternalServerError,
                 "An error occurred while processing the data.",
                 exception.Message),

            UnauthorizedAccessException =>
                (HttpStatusCode.Forbidden,
                 "You do not have permission to perform this action.",
                 exception.Message),

            TimeoutException =>
                (HttpStatusCode.GatewayTimeout,
                 "The operation timed out. Please try again.",
                 exception.Message),

            _ =>
                (HttpStatusCode.InternalServerError,
                 "An unexpected error occurred. Please try again later.",
                 exception.Message)
        };
    }
}
