; Inno Setup script - Video Downloader
#define AppName "Video Downloader"
#define AppVersion "1.0.0"
#define AppExe "VideoDownloader.exe"

[Setup]
AppId={{8F3C2B1E-5A0D-4C7B-9E21-6D4F1B7A9C30}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Video Downloader
DefaultDirName={autopf}\VideoDownloader
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist-installer
OutputBaseFilename=VideoDownloader-Setup
SetupIconFile=..\assets\app.ico
UninstallDisplayIcon={app}\{#AppExe}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Shortcuts:"
Name: "autostart"; Description: "Start with Windows (runs quietly near the clock)"; GroupDescription: "Options:"; Flags: unchecked

[Files]
Source: "..\dist\VideoDownloader\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autoprograms}\{#AppName} - browser extension folder"; Filename: "{app}\_internal\extension"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "VideoDownloader"; ValueData: """{app}\{#AppExe}"" --background"; Flags: uninsdeletevalue; Tasks: autostart

[Run]
Filename: "{app}\{#AppExe}"; Description: "Launch Video Downloader"; Flags: nowait postinstall skipifsilent
