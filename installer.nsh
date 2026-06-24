; ============================================================
;  Nebula Browser — Custom NSIS Installer Script
;  Nebula dark aesthetic + full component/feature selection
; ============================================================

; Required NSIS library includes (must come before any macro usage)
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

; ---------- Appearance & Branding ----------
!define MUI_BGCOLOR                  "1A0933"
!define MUI_TEXTCOLOR                "E8DFFF"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADER_TRANSPARENT_TEXT
!define MUI_BUTTONTEXT               "F0EEFF"

; ---- Variables ----
Var cbAI
Var cbAILater
Var cbNebulaApps
Var cbNotes
Var cbDrive
Var cbCookieInspector
Var cbPasswordManager
Var cbNeonMode
Var cbPrivacyDefault
Var cbGemini
Var cbNukeMode
Var cbStartup
Var cbTaskbar
Var cbDeleteData

; ============================================================
;  Inject two custom pages before the install step
; ============================================================
!macro customHeader
  Page custom NebulaFeaturesPage NebulaFeaturesLeave
  Page custom NebulaPrefsPage    NebulaPrefsLeave
!macroend

; ============================================================
;  PAGE 1: Feature Selection
; ============================================================
Function NebulaFeaturesPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ; Title label
  ${NSD_CreateLabel} 0u 0u 305u 14u "Choose Features — select which Nebula features to enable"
  Pop $0

  ; ── AI Group ──
  ${NSD_CreateGroupBox} 0u 16u 305u 58u " Nix AI Companion"
  Pop $0

  ${NSD_CreateCheckbox} 8u 30u 289u 12u "Enable Nix AI (powered by Hugging Face)"
  Pop $cbAI
  ${NSD_SetState} $cbAI ${BST_CHECKED}

  ${NSD_CreateCheckbox} 18u 44u 279u 12u "Download AI model on first use (recommended, free)"
  Pop $cbAILater
  ${NSD_SetState} $cbAILater ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8u 58u 289u 12u "Enable Gemini AI integration"
  Pop $cbGemini
  ${NSD_SetState} $cbGemini ${BST_CHECKED}

  ; ── Nebula Apps Group ──
  ${NSD_CreateGroupBox} 0u 80u 305u 56u " Nebula Apps"
  Pop $0

  ${NSD_CreateCheckbox} 8u 94u 289u 12u "Nebula Notes (built-in scratch pad workspace)"
  Pop $cbNotes
  ${NSD_SetState} $cbNotes ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8u 108u 289u 12u "Nebula Drive (local cloud file manager)"
  Pop $cbDrive
  ${NSD_SetState} $cbDrive ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8u 122u 289u 12u "Enable all Nebula Apps"
  Pop $cbNebulaApps
  ${NSD_SetState} $cbNebulaApps ${BST_CHECKED}

  ; ── Browser Features Group ──
  ${NSD_CreateGroupBox} 0u 142u 305u 90u " Browser Features"
  Pop $0

  ${NSD_CreateCheckbox} 8u 156u 289u 12u "Cookie Inspector (view and analyse site cookies)"
  Pop $cbCookieInspector
  ${NSD_SetState} $cbCookieInspector ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8u 170u 289u 12u "Built-in Password Manager (credential vault)"
  Pop $cbPasswordManager
  ${NSD_SetState} $cbPasswordManager ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8u 184u 289u 12u "Neon Mode (custom CSS glow effects on websites)"
  Pop $cbNeonMode
  ${NSD_SetState} $cbNeonMode ${BST_UNCHECKED}

  ${NSD_CreateCheckbox} 8u 198u 289u 12u "Privacy Mode on by default"
  Pop $cbPrivacyDefault
  ${NSD_SetState} $cbPrivacyDefault ${BST_UNCHECKED}

  ${NSD_CreateCheckbox} 8u 212u 289u 12u "Nuke Mode (aggressive tracker and ad blocking)"
  Pop $cbNukeMode
  ${NSD_SetState} $cbNukeMode ${BST_UNCHECKED}

  nsDialogs::Show
FunctionEnd

Function NebulaFeaturesLeave
  ${NSD_GetState} $cbAI $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "AIEnabled" $0

  ${NSD_GetState} $cbAILater $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "AIDownloadOnFirstUse" $0

  ${NSD_GetState} $cbGemini $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "GeminiEnabled" $0

  ${NSD_GetState} $cbNotes $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "NotesEnabled" $0

  ${NSD_GetState} $cbDrive $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "DriveEnabled" $0

  ${NSD_GetState} $cbNebulaApps $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "NebulaAppsEnabled" $0

  ${NSD_GetState} $cbCookieInspector $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "CookieInspector" $0

  ${NSD_GetState} $cbPasswordManager $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "PasswordManager" $0

  ${NSD_GetState} $cbNeonMode $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "NeonMode" $0

  ${NSD_GetState} $cbPrivacyDefault $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "PrivacyModeDefault" $0

  ${NSD_GetState} $cbNukeMode $0
  WriteRegDWORD HKCU "Software\NebulaBrowser\Features" "NukeModeDefault" $0
FunctionEnd

; ============================================================
;  PAGE 2: Startup & System Preferences
; ============================================================
Function NebulaPrefsPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0u 0u 305u 14u "Startup Preferences — choose how Nebula integrates with Windows"
  Pop $0

  ${NSD_CreateGroupBox} 0u 16u 305u 54u " System Integration"
  Pop $0

  ${NSD_CreateCheckbox} 8u 30u 289u 14u "Launch Nebula Browser at Windows startup"
  Pop $cbStartup
  ${NSD_SetState} $cbStartup ${BST_UNCHECKED}

  ${NSD_CreateCheckbox} 8u 46u 289u 14u "Pin Nebula Browser to taskbar after install"
  Pop $cbTaskbar
  ${NSD_SetState} $cbTaskbar ${BST_CHECKED}

  ${NSD_CreateGroupBox} 0u 76u 305u 40u " Uninstall Options"
  Pop $0

  ${NSD_CreateCheckbox} 8u 90u 289u 14u "Remove all user data (bookmarks, history, notes) when uninstalling"
  Pop $cbDeleteData
  ${NSD_SetState} $cbDeleteData ${BST_UNCHECKED}

  nsDialogs::Show
FunctionEnd

Function NebulaPrefsLeave
  ${NSD_GetState} $cbStartup $0
  ${If} $0 == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "NebulaBrowser" "$INSTDIR\Nebula Browser.exe"
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "NebulaBrowser"
  ${EndIf}

  ${NSD_GetState} $cbTaskbar $0
  ${If} $0 == ${BST_CHECKED}
    WriteRegDWORD HKCU "Software\NebulaBrowser" "PinTaskbar" 1
  ${EndIf}

  ${NSD_GetState} $cbDeleteData $0
  ${If} $0 == ${BST_CHECKED}
    WriteRegDWORD HKCU "Software\NebulaBrowser" "DeleteDataOnUninstall" 1
  ${Else}
    WriteRegDWORD HKCU "Software\NebulaBrowser" "DeleteDataOnUninstall" 0
  ${EndIf}
FunctionEnd

!macro customUnInstallSection
  ; Left empty to comply with electron-builder global scope parsing limits.
  ; Standard uninstall registry keys and folders are automatically handled by the default NSIS template.
!macroend
