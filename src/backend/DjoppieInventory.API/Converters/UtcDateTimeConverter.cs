using System.Text.Json;
using System.Text.Json.Serialization;

namespace DjoppieInventory.API.Converters;

/// <summary>
/// Custom JSON converter that ensures DateTime values are serialized as UTC with 'Z' suffix.
/// This prevents "Invalid Date" errors in JavaScript when parsing DateTime strings.
/// </summary>
public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dateString = reader.GetString();
        if (string.IsNullOrEmpty(dateString))
        {
            return DateTime.MinValue;
        }

        if (DateTime.TryParse(dateString, out var date))
        {
            // Always treat as UTC when deserializing
            return DateTime.SpecifyKind(date, DateTimeKind.Utc);
        }

        throw new JsonException($"Unable to parse '{dateString}' as DateTime.");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Convert to UTC if not already, then format with 'Z' suffix
        var utcValue = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();

        // Write in ISO 8601 format with 'Z' suffix (e.g., "2024-04-07T10:30:00.000Z")
        writer.WriteStringValue(utcValue.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
    }
}
