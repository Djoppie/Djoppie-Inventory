# Create asset import CSV from Intune export and service assignments
$ErrorActionPreference = "Stop"

# Read Intune export
$intuneDevices = Import-Csv -Path "C:\Users\jowij\Downloads\DevicesWithInventory_840076cc-26f2-4162-b9ad-fbcc238ac2b8\DevicesWithInventory_840076cc-26f2-4162-b9ad-fbcc238ac2b8.csv"

# Read service assignments from Excel
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Open("C:\Users\jowij\Downloads\Gekozen PC & telling (1).xlsx")
$ws = $wb.Sheets.Item(1)
$usedRange = $ws.UsedRange

# Build lookup table: Name -> Service
$serviceMap = @{}
for ($row = 2; $row -le $usedRange.Rows.Count; $row++) {
    $name = $ws.Cells.Item($row, 1).Text.Trim()
    $dienst = $ws.Cells.Item($row, 3).Text.Trim()
    if ($name -and $dienst) {
        $serviceMap[$name] = $dienst
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

# Map Excel dienst names to database service codes
$dienstToCode = @{
    "Preventie" = "preventie"
    "TD" = "facilitaire-ondersteuning"
    "Aankoopdienst" = "aankopen"
    "Financiën" = "financien"
    "Financien" = "financien"
    "Organisatiebeheersing" = "organisatiebeheersing"
    "Burgerzaken" = "burgerzaken"
    "Onthaal Burgerzaken" = "burgerzaken"
    "Juriste" = "bestuurssecretariaat"
    "Secretariaat" = "bestuurssecretariaat"
    "Gemeenteschool" = "GBS"
    "Ruimte" = "ruimte"
    "Thuiszorg" = "thuiszorg"
    "WZC" = "WZC"
    "Communicatie" = "communicatie"
    "IT" = "IT"
    "CBS" = "bestuurssecretariaat"
    "Beleven en Bewegen" = "beleven-bewegen"
    "HR" = "HR"
    "BKO & HVHK" = "begeleiders-BKO"
    "BIB" = "bibliotheek"
    "Sociale Dienst" = "socialedienst"
}

# Map model to asset type code
function Get-AssetTypeCode($deviceName, $model) {
    if ($deviceName -like "DT-*") { return "DESK" }
    if ($deviceName -like "LT-*") { return "LAP" }
    if ($model -match "Desktop|Mini|Micro") { return "DESK" }
    if ($model -match "Laptop|Notebook|ProBook|EliteBook|ZBook|Pro 16|Pro Max") { return "LAP" }
    return "LAP"
}

# Find service code for a user
function Get-ServiceCode($userName) {
    if (-not $userName) { return "IT" }

    # Try exact match first
    if ($serviceMap.ContainsKey($userName)) {
        $dienst = $serviceMap[$userName]
        if ($dienstToCode.ContainsKey($dienst)) {
            return $dienstToCode[$dienst]
        }
        return "IT"
    }

    # Try partial match (first name + last name variations)
    foreach ($key in $serviceMap.Keys) {
        if ($userName -like "*$key*" -or $key -like "*$userName*") {
            $dienst = $serviceMap[$key]
            if ($dienstToCode.ContainsKey($dienst)) {
                return $dienstToCode[$dienst]
            }
        }
    }

    return "IT"
}

# Create output
$output = @()
$output += "SerialNumber,AssetTypeCode,Status,PurchaseDate,IsDummy,AssetName,ServiceCode,Owner,Brand,Model,InstallationDate,WarrantyExpiry,Notes"

foreach ($device in $intuneDevices) {
    $serial = $device."Serial number"
    $deviceName = $device."Device name"
    $model = $device.Model
    $manufacturer = $device.Manufacturer
    $owner = $device."Primary user display name"
    $enrollmentDate = $device."Enrollment date"

    # Skip if no serial
    if (-not $serial) { continue }

    # Determine asset type
    $assetType = Get-AssetTypeCode $deviceName $model

    # Determine status
    $status = if ($owner) { "InGebruik" } else { "Stock" }

    # Get service code
    $serviceCode = Get-ServiceCode $owner

    # Clean up brand
    $brand = switch ($manufacturer) {
        "HP" { "HP" }
        "Dell Inc." { "Dell" }
        default { $manufacturer }
    }

    # Clean model name
    $cleanModel = $model -replace " Notebook PC", "" -replace " Mobile Workstation", "" -replace " Desktop Mini", " Mini"

    # Format enrollment date
    $purchaseDate = ""
    if ($enrollmentDate) {
        try {
            $date = [DateTime]::Parse($enrollmentDate.Split(" ")[0])
            $purchaseDate = $date.ToString("dd-MM-yyyy")
        } catch {}
    }

    # Escape any commas in fields
    $owner = $owner -replace ',', ' '
    $cleanModel = $cleanModel -replace ',', ' '
    $deviceName = $deviceName -replace ',', ' '

    $line = "$serial,$assetType,$status,$purchaseDate,false,$deviceName,$serviceCode,$owner,$brand,$cleanModel,,,"
    $output += $line
}

# Write output
$output | Out-File -FilePath "C:\Users\jowij\Downloads\asset-import-from-intune.csv" -Encoding UTF8

Write-Host "Created import file with $($output.Count - 1) devices"
Write-Host "Output: C:\Users\jowij\Downloads\asset-import-from-intune.csv"
