using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace DjoppieInventory.API.Middleware;

/// <summary>
/// Middleware for handling exceptions globally and returning consistent error responses
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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
        var (statusCode, message) = exception switch
        {
            ArgumentNullException or ArgumentException =>
                (HttpStatusCode.BadRequest, exception.Message),

            KeyNotFoundException =>
                (HttpStatusCode.NotFound, exception.Message),

            InvalidOperationException when exception.Message.Contains("already exists") =>
                (HttpStatusCode.Conflict, exception.Message),

            DbUpdateConcurrencyException =>
                (HttpStatusCode.Conflict, "The resource was modified by another user. Please refresh and try again."),

            DbUpdateException =>
                (HttpStatusCode.InternalServerError, "A database error occurred while processing your request."),

            AutoMapper.AutoMapperMappingException =>
                (HttpStatusCode.InternalServerError, "An error occurred while processing the data."),

            _ =>
                (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.")
        };

        // Log the exception with appropriate level
        if ((int)statusCode >= 500)
        {
            _logger.LogError(exception, "Server error occurred: {Message}", exception.Message);
        }
        else
        {
            _logger.LogWarning(exception, "Client error occurred: {Message}", exception.Message);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            error = message,
            statusCode = (int)statusCode,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
