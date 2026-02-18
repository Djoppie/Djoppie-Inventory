# Clear Assets and AssetTemplates from Azure SQL DEV
$ErrorActionPreference = "Stop"

$server = "sql-djoppie-inventory-dev-k5xdqp.database.windows.net"
$database = "sqldb-djoppie-inventory-dev"

Write-Host "Connecting to Azure SQL: $database"
Write-Host ""

# Get Azure access token
$token = az account get-access-token --resource https://database.windows.net/ --query accessToken -o tsv
if (-not $token) {
    Write-Error "Failed to get Azure access token. Run 'az login' first."
    exit 1
}

# Create connection
$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=$server;Database=$database;Encrypt=True;TrustServerCertificate=False;"
$conn.AccessToken = $token

try {
    $conn.Open()
    Write-Host "Connected successfully"
    Write-Host ""

    # Get current counts
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT COUNT(*) FROM dbo.Assets"
    $assetCount = $cmd.ExecuteScalar()

    $cmd.CommandText = "SELECT COUNT(*) FROM dbo.AssetTemplates"
    $templateCount = $cmd.ExecuteScalar()

    $cmd.CommandText = "SELECT COUNT(*) FROM dbo.AssetEvents"
    $eventCount = $cmd.ExecuteScalar()

    $cmd.CommandText = "SELECT COUNT(*) FROM dbo.LeaseContracts"
    $leaseCount = $cmd.ExecuteScalar()

    Write-Host "Current counts:"
    Write-Host "  - Assets: $assetCount"
    Write-Host "  - AssetTemplates: $templateCount"
    Write-Host "  - AssetEvents: $eventCount"
    Write-Host "  - LeaseContracts: $leaseCount"
    Write-Host ""

    if ($assetCount -eq 0 -and $templateCount -eq 0) {
        Write-Host "Tables are already empty. No action needed."
        exit 0
    }

    # Clear tables in order (child tables first)
    Write-Host "Clearing tables..."

    $cmd.CommandText = "DELETE FROM dbo.AssetEvents"
    $deleted = $cmd.ExecuteNonQuery()
    Write-Host "  - AssetEvents: $deleted rows deleted"

    $cmd.CommandText = "DELETE FROM dbo.LeaseContracts"
    $deleted = $cmd.ExecuteNonQuery()
    Write-Host "  - LeaseContracts: $deleted rows deleted"

    $cmd.CommandText = "DELETE FROM dbo.Assets"
    $deleted = $cmd.ExecuteNonQuery()
    Write-Host "  - Assets: $deleted rows deleted"

    $cmd.CommandText = "DELETE FROM dbo.AssetTemplates"
    $deleted = $cmd.ExecuteNonQuery()
    Write-Host "  - AssetTemplates: $deleted rows deleted"

    # Reset identity seeds
    Write-Host ""
    Write-Host "Resetting identity seeds..."
    $cmd.CommandText = "DBCC CHECKIDENT ('dbo.Assets', RESEED, 0)"
    $cmd.ExecuteNonQuery() | Out-Null
    $cmd.CommandText = "DBCC CHECKIDENT ('dbo.AssetTemplates', RESEED, 0)"
    $cmd.ExecuteNonQuery() | Out-Null
    $cmd.CommandText = "DBCC CHECKIDENT ('dbo.AssetEvents', RESEED, 0)"
    $cmd.ExecuteNonQuery() | Out-Null
    $cmd.CommandText = "DBCC CHECKIDENT ('dbo.LeaseContracts', RESEED, 0)"
    $cmd.ExecuteNonQuery() | Out-Null
    Write-Host "  - Identity seeds reset to 0"

    Write-Host ""
    Write-Host "SUCCESS: All assets and templates cleared!"

} finally {
    $conn.Close()
}
