﻿# この機能を動作させるための手順を記載
# chrome://settings/downloads
# chrome://settings/downloadsの設定 > ダウンロード前に各ファイルの保存場所を確認する > オフ
# 拡張機能をダウンロードする
# Downloads Overwrite Already Existing Files
# Duplicate Tabs Closer
# Duplicate Tabs Closerのオプション > 優先順位 > 新しい方のタブを残す

# 定数定義
$TEST_RESULT_FILE = "your-test-result-file-name-here"
# ※ダウンロード直下にプロジェクトを配置する必要がある
$TEST_RUNNER_PATH = "your-test-runner-file-path-here"

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WindowsAPI {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, int dwFlags, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);

    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("imm32.dll")]
    public static extern IntPtr ImmGetDefaultIMEWnd(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const int KEYEVENTF_KEYUP = 0x0002;
    public const int VK_RETURN = 0x0D;
    public const int SW_SHOW = 5;
    public const uint WM_IME_CONTROL = 0x0283;
    public const int IMC_SETOPENSTATUS = 0x0006;
}
"@

function Find-VSCodeWindow {
    $processes = Get-Process | Where-Object { $_.MainWindowTitle -match "- Cursor$" }
    if ($processes) {
        $window = $processes | Select-Object -First 1
        Write-Host "Cursorウィンドウを検出しました: $($window.MainWindowTitle)"
        Write-Host "ウィンドウハンドル: $($window.MainWindowHandle)"
        return $window.MainWindowHandle
    }
    else {
        Write-Host "Cursorウィンドウが見つかりませんでした"
        return [IntPtr]::Zero
    }
}

function Send-KeyboardInput {
    param(
        [IntPtr]$hwnd,
        [string]$message
    )
    
    try {
        Write-Host "Setting window focus..."
        [WindowsAPI]::ShowWindow($hwnd, [WindowsAPI]::SW_SHOW)
        Start-Sleep -Milliseconds 1000
        [WindowsAPI]::BringWindowToTop($hwnd)
        Start-Sleep -Milliseconds 1000
        
        if ([WindowsAPI]::SetForegroundWindow($hwnd)) {
            $currentWindow = [WindowsAPI]::GetForegroundWindow()
            if ($currentWindow -eq $hwnd) {
                Write-Host "Focus set successfully"
                
                # チャットパネルにフォーカス
                Write-Host "Moving focus to chat panel (Ctrl + Shift + Y)"
                [System.Windows.Forms.SendKeys]::SendWait("^+Y")
                Start-Sleep -Milliseconds 500
                
                # Composerにフォーカス
                Write-Host "Moving focus to composer (Ctrl + I)"
                [System.Windows.Forms.SendKeys]::SendWait("^i")
                Start-Sleep -Milliseconds 500

                # IMEを無効化
                Write-Host "Disabling IME..."
                $imeWnd = [WindowsAPI]::ImmGetDefaultIMEWnd($hwnd)
                [WindowsAPI]::SendMessage($imeWnd, [WindowsAPI]::WM_IME_CONTROL, [IntPtr]::new([WindowsAPI]::IMC_SETOPENSTATUS), [IntPtr]::Zero)
                Start-Sleep -Milliseconds 1000
                
                Write-Host "Sending message: $message"
                [System.Windows.Forms.SendKeys]::SendWait($message)
                Start-Sleep -Milliseconds 3000  # メッセージ入力完了後の待機時間を延長
                
                Write-Host "Sending Enter keys..."
                [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                Start-Sleep -Milliseconds 1000
                [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
                Start-Sleep -Milliseconds 1000
                [System.Windows.Forms.SendKeys]::SendWait("~")  # 別の方法でEnterを送信
                Start-Sleep -Milliseconds 1000
                
                Write-Host "Keyboard operation completed"
                return $true
            }
            else {
                Write-Host "Failed to verify focus"
            }
        }
        else {
            Write-Host "SetForegroundWindow failed"
        }
    }
    catch {
        Write-Host "Error during window operation: $_"
    }
    return $false
}

# Windows Formsアセンブリの読み込み
Add-Type -AssemblyName System.Windows.Forms

# テスト結果の監視を開始
Write-Host "テスト結果の監視を開始します..."
Write-Host "監視対象: $TEST_RESULT_FILE"
Write-Host ""

# 監視開始時刻を記録
$startTime = Get-Date
Write-Host "テストログの監視を開始します"
Write-Host "監視開始時刻: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host "チェック間隔: 10秒"
Write-Host ""

# テストHTMLファイルを起動
Write-Host "テストHTMLファイルを起動します: $TEST_RUNNER_PATH"
Start-Process $TEST_RUNNER_PATH
Write-Host "テストHTMLファイルを起動しました"
Write-Host ""

# 監視状態の初期化
$lastContent = $null
$lastUpdateTime = $null
$noUpdateCount = 0
$maxNoUpdateCount = 3  # 30秒間更新がない場合に終了
$isFirstUpdate = $true

# ファイルの監視を開始
while ($true) {
    try {
        # ファイルが存在する場合のみ処理
        if (Test-Path $TEST_RESULT_FILE) {
            $currentContent = Get-Content $TEST_RESULT_FILE -Raw -ErrorAction Stop
            
            # 初回または内容が変更された場合
            if ($lastContent -eq $null -or $currentContent -ne $lastContent) {
                $lastContent = $currentContent
                $lastUpdateTime = Get-Date
                $noUpdateCount = 0
                
                if ($isFirstUpdate) {
                    Write-Host "初回のテスト結果を検出しました"
                    $isFirstUpdate = $false
                }
                else {
                    Write-Host "テスト結果が更新されました"
                }
                
                # 重大なエラーまたは完了状態の検出
                if ($currentContent -match "重大なエラー") {
                    Write-Host "`n重大なエラーを検出しました"
                    Write-Host "最終更新: $($lastUpdateTime.ToString('yyyy-MM-dd HH:mm:ss'))"
                    break
                }
                elseif ($currentContent -match "実行状態: 完了") {
                    Write-Host "`nテスト完了を検出しました"
                    Write-Host "最終更新: $($lastUpdateTime.ToString('yyyy-MM-dd HH:mm:ss'))"
                    break
                }
            }
            else {
                # 前回の更新から10秒以上経過している場合のみカウント
                $timeSinceLastUpdate = (Get-Date) - $lastUpdateTime
                if ($timeSinceLastUpdate.TotalSeconds -ge 10) {
                    $noUpdateCount++
                    Write-Host "更新なし: $($noUpdateCount)回目 (最終更新から$([Math]::Floor($timeSinceLastUpdate.TotalSeconds))秒経過)"
                    $lastUpdateTime = Get-Date  # 更新時刻をリセット
                    
                    # 一定回数以上更新がない場合は終了
                    if ($noUpdateCount -ge $maxNoUpdateCount) {
                        Write-Host "`n30秒間更新がないため、監視を終了します"
                        Write-Host "最終更新: $($lastUpdateTime.ToString('yyyy-MM-dd HH:mm:ss'))"
                        break
                    }
                }
            }
        }
        else {
            if ($lastContent -eq $null) {
                Write-Host "テスト結果ファイルの作成を待機中..."
            }
        }
        
        # 10秒待機
        Start-Sleep -Seconds 10
        
    }
    catch {
        Write-Host "エラーが発生しました: $_"
        break
    }
}

Write-Host ""
Write-Host "監視を終了します"
$endTime = Get-Date
Write-Host "監視終了時刻: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))"
$duration = $endTime - $startTime
Write-Host "総監視時間: $([Math]::Floor($duration.TotalSeconds))秒"

# テスト結果ファイルの内容を出力
Write-Host "`nテスト結果ファイルの内容:"
Write-Host "----------------------------------------"
if (Test-Path $TEST_RESULT_FILE) {
    try {
        # UTF-8でファイルを読み込む
        $content = Get-Content $TEST_RESULT_FILE -Raw -Encoding UTF8 -ErrorAction Stop
        # HTMLタグを除去して見やすくする
        $content = $content -replace '<[^>]+>', ''  # HTMLタグを削除
        $content = $content -replace '^\s+|\s+$', ''  # 前後の空白を削除
        $content = $content -replace '\n\s*\n\s*\n', "`n`n"  # 3行以上の空行を2行に
        
        # UTF-8で出力
        $OutputEncoding = [System.Text.Encoding]::UTF8
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
        Write-Host $content
    }
    catch {
        Write-Host "テスト結果ファイルの読み取りに失敗しました: $_"
    }
}
else {
    Write-Host "テスト結果ファイルが見つかりません: $TEST_RESULT_FILE"
}
Write-Host "----------------------------------------`n"

# Cursorへの通知
$hwnd = Find-VSCodeWindow
if ($hwnd -ne [IntPtr]::Zero) {
    Write-Host "`nCursorへテスト完了を通知します..."
    if (Send-KeyboardInput $hwnd "Test execution completed. Please check the $TEST_RESULT_FILE file in the Downloads directory for detailed results. When reviewing the test results, ensure to check the execution time in the logs. If the timestamps are earlier than the time of your verification, it indicates that the test logs were not generated. Avoid making incorrect fixes based on this.") {
        Write-Host "通知が完了しました"    
    }
    else {
        Write-Host "通知に失敗しました"
        exit 1
    }
}
else {
    Write-Host "Cursorウィンドウが見つからないため、通知をスキップします"
    exit 1
} 
