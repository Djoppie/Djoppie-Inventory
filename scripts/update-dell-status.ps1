$csv = Import-Csv -Path "C:\Users\jowij\Downloads\asset-import-complete.csv"
$count = 0
foreach ($row in $csv) {
    if ($row.Brand -eq "Dell") {
        $row.Status = "Nieuw"
        $count++
    }
}
$csv | Export-Csv -Path "C:\Users\jowij\Downloads\asset-import-complete.csv" -NoTypeInformation -Encoding UTF8
Write-Host "$count Dell devices changed to status 'Nieuw'"
