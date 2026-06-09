const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const { spawnSync } = require('child_process');

async function testImport() {
  const localAppData = process.env.LOCALAPPDATA;
  const browsers = [
    {
      name: 'Chrome',
      basePath: path.join(localAppData, 'Google', 'Chrome', 'User Data')
    },
    {
      name: 'Edge',
      basePath: path.join(localAppData, 'Microsoft', 'Edge', 'User Data')
    },
    {
      name: 'Brave',
      basePath: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data')
    }
  ];

  for (const browser of browsers) {
    console.log(`\nChecking browser: ${browser.name}`);
    const localStatePath = path.join(browser.basePath, 'Local State');
    if (!fs.existsSync(localStatePath)) {
      console.log(`  Local State not found at ${localStatePath}`);
      continue;
    }

    try {
      const localState = JSON.parse(fs.readFileSync(localStatePath, 'utf8'));
      const encryptedKeyB64 = localState.os_crypt.encrypted_key;
      if (!encryptedKeyB64) {
        console.log(`  No encrypted key found in Local State`);
        continue;
      }
      const encryptedKeyWithPrefix = Buffer.from(encryptedKeyB64, 'base64');
      const dpapiEncrypted = encryptedKeyWithPrefix.slice(5);

      const dpapiB64 = dpapiEncrypted.toString('base64');
      const psScriptPath = path.join(os.tmpdir(), 'nebula_dpapi_test.ps1');
      fs.writeFileSync(psScriptPath, `
param([string]$enc)
Add-Type -AssemblyName System.Security
$bytes = [Convert]::FromBase64String($enc)
$dec = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($dec)
`);
      const psResult = spawnSync('powershell', [
        '-NonInteractive', '-ExecutionPolicy', 'Bypass',
        '-File', psScriptPath,
        '-enc', dpapiB64
      ], { encoding: 'utf8' });
      try { fs.unlinkSync(psScriptPath); } catch {}
      if (psResult.status !== 0 || !psResult.stdout.trim()) {
        console.log(`  DPAPI decryption failed:`, psResult.stderr || psResult.stdout);
        continue;
      }
      const masterKey = Buffer.from(psResult.stdout.trim(), 'base64');
      console.log(`  Master key decrypted successfully (${masterKey.length} bytes)`);

      const profiles = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];
      for (const profile of profiles) {
        const cookiePaths = [
          path.join(browser.basePath, profile, 'Network', 'Cookies'),
          path.join(browser.basePath, profile, 'Cookies')
        ];
        
        let cookiePath = null;
        for (const p of cookiePaths) {
          if (fs.existsSync(p)) {
            cookiePath = p;
            break;
          }
        }

        if (!cookiePath) continue;
        console.log(`  Found cookie database for profile [${profile}] at: ${cookiePath}`);

        const tempPath = path.join(os.tmpdir(), `test_cookies_${Date.now()}.db`);
        
        // Use cmd.exe /c copy to bypass the exclusive write lock and copy the database
        const { execSync } = require('child_process');
        try {
          execSync(`cmd.exe /c copy /y "${cookiePath}" "${tempPath}"`, { stdio: 'ignore' });
        } catch (copyErr) {
          console.log(`    cmd copy failed: ${copyErr.message}`);
          continue;
        }

        try {
          const db = new Database(tempPath, { readonly: true });
          const rows = db.prepare(`
            SELECT host_key, name, value, encrypted_value, path, expires_utc
            FROM cookies
            WHERE host_key LIKE '%.google.com'
          `).all();
          db.close();

          let count = 0;
          for (const row of rows) {
            let cookieValue = row.value;

            if (row.encrypted_value && row.encrypted_value.length > 3) {
              const encBuf = Buffer.from(row.encrypted_value);
              const prefix = encBuf.slice(0, 3).toString('ascii');
              if (prefix === 'v10' || prefix === 'v11') {
                try {
                  const iv = encBuf.slice(3, 15);
                  const tag = encBuf.slice(-16);
                  const ciphertext = encBuf.slice(15, -16);
                  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
                  decipher.setAuthTag(tag);
                  cookieValue = decipher.update(ciphertext, null, 'utf8') + decipher.final('utf8');
                } catch (e) {
                  continue;
                }
              }
            }
            if (cookieValue) {
              count++;
            }
          }
          console.log(`    Successfully decrypted ${count} Google cookies in profile [${profile}]`);
        } catch (dbErr) {
          console.log(`    Database query failed for profile [${profile}]:`, dbErr.message);
        } finally {
          try { fs.unlinkSync(tempPath); } catch {}
        }
      }
    } catch (err) {
      console.log(`  Error processing ${browser.name}:`, err.message);
    }
  }
}

testImport().catch(console.error);
