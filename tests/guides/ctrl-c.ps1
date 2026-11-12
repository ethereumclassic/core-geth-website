# Press Ctrl+C in the window a process runs in, as a reader does, wait for that process to exit, then save the
# window's text. With -ReadOnly it only saves the text. lib.ps1 runs this in a powershell.exe of its own,
# because attaching to another window detaches the process that does it from its own.
# Usage: ctrl-c.ps1 -ProcessId <a process in the window> -Log <file> [-ReadOnly]
param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [Parameter(Mandatory = $true)][string]$Log,
  [switch]$ReadOnly
)
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

namespace Guides {
  public static class Window {
    [DllImport("kernel32.dll", SetLastError = true)] public static extern bool FreeConsole();
    [DllImport("kernel32.dll", SetLastError = true)] public static extern bool AttachConsole(uint processId);
    [DllImport("kernel32.dll", SetLastError = true)] public static extern bool SetConsoleCtrlHandler(IntPtr handler, bool add);
    [DllImport("kernel32.dll", SetLastError = true)] public static extern bool GenerateConsoleCtrlEvent(uint ctrlEvent, uint processGroupId);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr CreateFileW(string name, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool CloseHandle(IntPtr handle);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool GetConsoleScreenBufferInfo(IntPtr output, out BufferInfo info);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool ReadConsoleOutputCharacterW(IntPtr output, [Out] StringBuilder text, uint length, Coord at, out uint read);

    [StructLayout(LayoutKind.Sequential)] struct Coord { public short X; public short Y; }
    [StructLayout(LayoutKind.Sequential)] struct Rect { public short Left; public short Top; public short Right; public short Bottom; }
    [StructLayout(LayoutKind.Sequential)] struct BufferInfo { public Coord Size; public Coord Cursor; public short Attributes; public Rect Shown; public Coord Largest; }

    public static string Read() {
      IntPtr output = CreateFileW("CONOUT$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
      if (output == new IntPtr(-1)) return "(the window could not be opened: error " + Marshal.GetLastWin32Error() + ")";
      try {
        BufferInfo info;
        if (!GetConsoleScreenBufferInfo(output, out info)) return "(the window could not be read: error " + Marshal.GetLastWin32Error() + ")";
        StringBuilder text = new StringBuilder();
        for (short y = 0; y <= info.Cursor.Y; y++) {
          StringBuilder line = new StringBuilder(info.Size.X + 1);
          uint read;
          Coord at;
          at.X = 0;
          at.Y = y;
          if (ReadConsoleOutputCharacterW(output, line, (uint)info.Size.X, at, out read)) text.AppendLine(line.ToString(0, (int)read).TrimEnd());
        }
        return text.ToString();
      } finally {
        CloseHandle(output);
      }
    }
  }
}
'@

$target = Get-Process -Id $ProcessId
$null = $target.Handle
[Guides.Window]::FreeConsole() | Out-Null
if (-not [Guides.Window]::AttachConsole([uint32]$ProcessId)) {
  throw "could not attach to the window of process $ProcessId (error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
}
if (-not $ReadOnly) {
  # Ignore the Ctrl+C here, then send it to every process in the window, as the key does.
  [Guides.Window]::SetConsoleCtrlHandler([IntPtr]::Zero, $true) | Out-Null
  if (-not [Guides.Window]::GenerateConsoleCtrlEvent(0, 0)) {
    throw "could not press Ctrl+C (error $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))"
  }
  if (-not $target.WaitForExit(300000)) { throw "process $ProcessId did not exit within 300 seconds of Ctrl+C" }
  Start-Sleep -Seconds 2
}
[IO.File]::WriteAllText($Log, [Guides.Window]::Read())
[Guides.Window]::FreeConsole() | Out-Null
