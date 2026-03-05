# Merge Intune export with Dell PRO 16 delivery data
$ErrorActionPreference = "Stop"

# Read current Intune-based import
$intuneData = Import-Csv -Path "C:\Users\jowij\Downloads\asset-import-from-intune.csv"
Write-Host "Loaded $($intuneData.Count) devices from Intune export"

# Create lookup by serial number
$serialLookup = @{}
foreach ($device in $intuneData) {
    $serialLookup[$device.SerialNumber] = $device
}

# Read Dell delivery Excel
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$wb = $excel.Workbooks.Open("C:\Users\jowij\Downloads\Dell PRO 16 levering.xlsx")
$ws = $wb.Sheets.Item(1)
$usedRange = $ws.UsedRange

# Parse Dell delivery data (skip header row)
$dellDevices = @()
for ($row = 2; $row -le $usedRange.Rows.Count; $row++) {
    $serial = $ws.Cells.Item($row, 5).Text.Trim()  # Column E = Serienummer
    $tagRD = $ws.Cells.Item($row, 8).Text.Trim()   # Column H = Tag RD
    $dnote = $ws.Cells.Item($row, 2).Text.Trim()   # Column B = DNOTE
    $po = $ws.Cells.Item($row, 3).Text.Trim()      # Column C = PO

    if ($serial) {
        $dellDevices += @{
            Serial = $serial
            TagRD = $tagRD
            DNOTE = $dnote
            PO = $po
        }
    }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "Loaded $($dellDevices.Count) devices from Dell delivery"

# Create output with header
$output = @()
$output += "SerialNumber,AssetTypeCode,Status,PurchaseDate,IsDummy,AssetName,ServiceCode,Owner,Brand,Model,InstallationDate,WarrantyExpiry,Notes"

$updatedCount = 0
$addedCount = 0
$existingCount = 0

# Process all Intune devices, adding Dell Tag RD where applicable
foreach ($device in $intuneData) {
    $serial = $device.SerialNumber

    # Check if this is a Dell device from the delivery
    $dellMatch = $dellDevices | Where-Object { $_.Serial -eq $serial }

    $notes = $device.Notes
    if ($dellMatch) {
        # Add Tag RD to notes
        $notes = "Tag RD: $($dellMatch.TagRD) - DNOTE $($dellMatch.DNOTE)"
        $updatedCount++
    }

    $line = "$($device.SerialNumber),$($device.AssetTypeCode),$($device.Status),$($device.PurchaseDate),$($device.IsDummy),$($device.AssetName),$($device.ServiceCode),$($device.Owner),$($device.Brand),$($device.Model),$($device.InstallationDate),$($device.WarrantyExpiry),$notes"
    $output += $line
    $existingCount++
}

# Add Dell devices NOT in Intune (new/not yet enrolled)
foreach ($dell in $dellDevices) {
    if (-not $serialLookup.ContainsKey($dell.Serial)) {
        $notes = "Tag RD: $($dell.TagRD) - DNOTE $($dell.DNOTE) - Nieuw (niet in Intune)"
        $line = "$($dell.Serial),LAP,Nieuw,,false,,IT,,Dell,Dell Pro 16 PC16250,,,`"$notes`""
        $output += $line
        $addedCount++
    }
}

# Write output
$output | Out-File -FilePath "C:\Users\jowij\Downloads\asset-import-complete.csv" -Encoding UTF8

Write-Host ""
Write-Host "=== Results ==="
Write-Host "Intune devices: $existingCount"
Write-Host "Dell devices updated with Tag RD: $updatedCount"
Write-Host "New Dell devices added (not in Intune): $addedCount"
Write-Host "Total devices: $($existingCount + $addedCount)"
Write-Host ""
Write-Host "Output: C:\Users\jowij\Downloads\asset-import-complete.csv"
