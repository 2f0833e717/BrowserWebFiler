# Browser File Manager 詳細設計書

## 目次

1. システム概要

2. システムフロー
   - 2.1 メインフロー
   - 2.2 ファイル操作フロー
   - 2.3 イベント処理フロー
     - 2.3.1 キーボードイベントフロー
     - 2.3.2 フォーカス管理フロー
     - 2.3.3 ペイン操作フロー
   - 2.4 UI更新フロー
   - 2.5 エラー処理フロー

3. 実装設計
   - 3.1 ディレクトリ構成
   - 3.2 モジュール依存関係
   - 3.3 初期化シーケンス
   - 3.4 エラーハンドリング実装

4. 状態管理
   - 4.1 アプリケーション状態
   - 4.2 エラー処理

5. セキュリティ考慮事項

6. パフォーマンス考慮事項

* * *

## 1. システム概要

Browser File Managerは、ブラウザベースの2画面の左右ペイン式ファイルマネージャーです。
キーボード操作を重視し、効率的なファイル管理を実現します。

システムファイルエリア以外で操作可能です。
※C:\直下やダウンロードフォルダ直下などでは、ブラウザのセキュリティ上ご使用ができません。

本フローチャートはAIで自動作成したものです。
一部存在しない機能や処理が含まれている可能性がありますが、目安資料として活用してください。

* * *

## 2. システムフロー

### 2.1 メインフロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([開始]) --> Init[アプリケーション初期化]
    Init --> LoadConfig[設定読み込み]
    LoadConfig --> InitUI[UI初期化]
    InitUI --> EventInit[イベントリスナー初期化]
    EventInit --> InitKeyboard[キーボードハンドラー初期化]
    InitKeyboard --> InitPanes[左右ペイン初期化]
    
    InitPanes --> WaitDir[ディレクトリ選択待機]
    WaitDir --> |ディレクトリ選択| ValidatePath{パス検証}
    ValidatePath -->|無効| ShowError[エラー表示]
    ShowError --> WaitDir
    ValidatePath -->|有効| LoadDir[ディレクトリ読み込み]
    LoadDir --> SortFiles[ファイル一覧ソート]
    SortFiles --> FilterFiles[ファイルフィルタリング]
    FilterFiles --> DisplayFiles[ファイル一覧表示]
    DisplayFiles --> UpdatePath[パス表示更新]
    
    UpdatePath --> WaitOp[操作待機]
    WaitOp --> |キー操作| KeyEvent[キーイベント処理]
    KeyEvent --> HandleOp[操作処理]
    HandleOp --> UpdateUI[UI更新]
    UpdateUI --> LogOp[操作ログ記録]
    LogOp --> WaitOp
    
    WaitOp --> |終了| Cleanup[リソース解放]
    Cleanup --> End([終了])
```

### 2.2 ファイル操作フロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([操作開始]) --> CheckOp{操作種別}
    
    CheckOp -->|コピー| ValidateCopy{コピー検証}
    CheckOp -->|移動| ValidateMove{移動検証}
    CheckOp -->|削除| ValidateDelete{削除検証}
    CheckOp -->|新規作成| ValidateCreate{作成検証}
    
    ValidateCopy -->|権限なし| ShowErrorCopy[エラー表示]
    ValidateMove -->|権限なし| ShowErrorMove[エラー表示]
    ValidateDelete -->|権限なし| ShowErrorDelete[エラー表示]
    ValidateCreate -->|権限なし| ShowErrorCreate[エラー表示]
    
    ValidateMove -->|OK| ConfirmMove{確認ダイアログ}
    ValidateDelete -->|OK| ConfirmDelete{確認ダイアログ}
    
    ValidateCopy -->|OK| ExecCopy[コピー実行]
    ConfirmMove -->|Yes| ExecMove[移動実行]
    ConfirmMove -->|No| Log[ログ記録]
    ConfirmDelete -->|Yes| ExecDelete[削除実行]
    ConfirmDelete -->|No| Log
    ValidateCreate -->|OK| ExecCreate[作成実行]
    
    ExecCopy -->|成功| UpdateListCopy[一覧更新]
    ExecCopy -->|失敗| HandleErrorCopy[エラー処理]
    ExecMove -->|成功| UpdateListMove[一覧更新]
    ExecMove -->|失敗| HandleErrorMove[エラー処理]
    ExecDelete -->|成功| UpdateListDelete[一覧更新]
    ExecDelete -->|失敗| HandleErrorDelete[エラー処理]
    ExecCreate -->|成功| UpdateListCreate[一覧更新]
    ExecCreate -->|失敗| HandleErrorCreate[エラー処理]
    
    UpdateListCopy --> Log
    UpdateListMove --> Log
    UpdateListDelete --> Log
    UpdateListCreate --> Log
    HandleErrorCopy --> Log
    HandleErrorMove --> Log
    HandleErrorDelete --> Log
    HandleErrorCreate --> Log
    ShowErrorCopy --> Log
    ShowErrorMove --> Log
    ShowErrorDelete --> Log
    ShowErrorCreate --> Log
    
    Log --> End([操作完了])
```

### 2.3 イベント処理フロー

#### 2.3.1 キーボードイベントフロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([キーイベント発生]) --> CheckMode{モード確認}
    
    CheckMode -->|通常モード| NormalKeys{キー種別}
    CheckMode -->|履歴表示モード| HistoryKeys{キー種別}
    
    NormalKeys -->|上下キー| MoveFocus[フォーカス上下移動]
    NormalKeys -->|PageUp/Down| PageMove[フォーカス最上最下移動]
    NormalKeys -->|左右キー| PaneSwitch[ペイン切替]
    NormalKeys -->|Enter| DirEnterFromNomal[ディレクトリ移動]
    NormalKeys -->|Shift+o| SyncPane[ペイン同期]
    NormalKeys -->|Space/m/c/d| CmdModeOn[コマンドモード開始]
    
    CmdModeOn --> CommandKeys{キー種別}
    CommandKeys -->|m| MoveOp[移動操作]
    CommandKeys -->|c| CopyOp[コピー操作]
    CommandKeys -->|d| DeleteOp[削除操作]
    CommandKeys -->|Esc| CmdModeOff[コマンドモード終了]
    CommandKeys -->|Space| ToggleCmd[コマンドモード切替]
    
    HistoryKeys -->|上下キー| HistorySelect[履歴選択]
    HistoryKeys -->|Enter| DirEnterFromHistory[選択ディレクトリへ移動]
    HistoryKeys -->|Esc/h| CloseHistory[履歴表示終了]
    HistoryKeys -->|PageUp/Down| PageUpDownHistory[履歴の移動]
    
    MoveOp --> MoveCheck{ファイル確認}
    MoveCheck -->|重複| MoveOverwrite[上書き確認]
    MoveCheck -->|新規| ExecMove[移動実行]
    MoveOverwrite -->|Yes| ExecMove
    MoveOverwrite -->|No| CancelMove[移動キャンセル]
    
    CopyOp --> CopyCheck{ファイル確認}
    CopyCheck -->|重複| CopyOverwrite[上書き確認]
    CopyCheck -->|新規| ExecCopy[コピー実行]
    CopyOverwrite -->|Yes| ExecCopy
    CopyOverwrite -->|No| CancelCopy[コピーキャンセル]
    
    DeleteOp --> DeleteConfirm[削除確認]
    DeleteConfirm -->|Yes| ExecDelete[削除実行]
    DeleteConfirm -->|No| CancelDelete[削除キャンセル]
    
    MoveFocus --> UpdateUI[UI更新]
    PageMove --> UpdateUI
    PaneSwitch --> UpdateUI
    DirEnterFromNomal --> UpdateUI
    SyncPane --> UpdateUI
    ExecMove --> UpdateUI
    CancelMove --> UpdateUI
    ExecCopy --> UpdateUI
    CancelCopy --> UpdateUI
    ExecDelete --> UpdateUI
    CancelDelete --> UpdateUI
    CmdModeOff --> UpdateUI
    ToggleCmd --> UpdateUI
    CloseHistory --> UpdateUI
    DirEnterFromHistory --> UpdateUI
    
    UpdateUI --> LogOp[操作ログ記録]
    LogOp --> End([処理完了])
```

#### 2.3.2 フォーカス管理フロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([フォーカスイベント]) --> FocusCheck{フォーカス種別}
    
    FocusCheck -->|左ペイン| LeftFocus[左ペインフォーカス]
    FocusCheck -->|右ペイン| RightFocus[右ペインフォーカス]
    
    LeftFocus --> SaveState[状態保存]
    RightFocus --> SaveState
    
    SaveState --> UpdateFocus[フォーカス更新]
    UpdateFocus --> UpdateUI[UI更新]
    UpdateUI --> Log[ログ記録]
    Log --> End([処理完了])
```

#### 2.3.3 ペイン操作フロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([ペイン操作]) --> PaneCheck{操作種別}
    
    PaneCheck -->|左右移動 ←→| MoveFocus[フォーカス移動]
    PaneCheck -->|同期 Shift+o| SyncCheck{同期方向}
    
    MoveFocus --> SaveFocus[フォーカス状態保存]
    
    SyncCheck -->|左to右| LeftToRight[左から右へ同期]
    SyncCheck -->|右to左| RightToLeft[右から左へ同期]
    
    LeftToRight --> UpdatePane[ペイン更新]
    RightToLeft --> UpdatePane
    
    SaveFocus --> UpdateUI[UI更新]
    UpdatePane --> UpdateUI
    
    UpdateUI --> UpdatePath[パス表示更新]
    UpdatePath --> Log[ログ記録]
    Log --> End([処理完了])
```

### 2.4 UI更新フロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([UI更新開始]) --> UpdateType{更新種別}
    
    UpdateType -->|ファイル一覧| UpdateList[一覧更新]
    UpdateType -->|パス表示| UpdatePath[パス表示更新]
    UpdateType -->|ログ表示| UpdateLog[ログ表示更新]
    UpdateType -->|フォーカス| UpdateFocus[フォーカス更新]
    
    UpdateList --> RefreshList[リスト再描画]
    UpdatePath --> RefreshPath[パス再描画]
    UpdateLog --> ScrollCheck{スクロール位置}
    UpdateFocus --> RefreshFocus[フォーカス再描画]
    
    ScrollCheck -->|最下部| ResetScroll[スクロールリセット]
    ScrollCheck -->|その他| KeepScroll[位置保持]
    
    RefreshList --> Complete[更新完了]
    RefreshPath --> Complete
    ResetScroll --> Complete
    KeepScroll --> Complete
    RefreshFocus --> Complete
    
    Complete --> End([UI更新完了])
```

### 2.5 エラー処理フロー

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([エラー発生]) --> CheckType{エラー種別}
    
    CheckType -->|ファイルシステム| FSError[ファイルシステムエラー]
    CheckType -->|操作| OpError[操作エラー]
    CheckType -->|UI| UIError[UI更新エラー]
    
    FSError --> FSAccess[アクセス権限エラー]
    FSError --> FSPath[パス不正エラー]
    FSError --> FSExists[存在確認エラー]
    
    OpError --> OpOverwrite[上書き確認]
    OpError --> OpDelete[削除確認]
    OpError --> OpParent[親ディレクトリ制限]
    
    UIError --> UIHandle[ハンドル更新エラー]
    UIError --> UIFocus[フォーカス更新エラー]
    
    FSAccess --> LogError[エラーログ記録]
    FSPath --> LogError
    FSExists --> LogError
    OpOverwrite -->|キャンセル| CancelOp[操作キャンセル]
    OpDelete -->|キャンセル| CancelOp
    OpParent --> LogError
    OpOverwrite -->|確認| ExecOp[操作実行]
    OpDelete -->|確認| ExecOp
    
    UIHandle --> LogError
    UIFocus --> LogError
    
    CancelOp --> ExitCmd[コマンドモード終了]
    LogError --> ExitCmd
    ExecOp --> UpdateUI[UI更新]
    UpdateUI --> ExitCmd
    
    ExitCmd --> End([処理完了])
```

* * *

## 3. 実装設計

### 3.1 ディレクトリ構成

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
flowchart LR
    Root[src/app/javascript] --> Core[core/]
    Root --> Operations[operations/]
    Root --> UI[ui/]
    Root --> Events[events/]
    
    Core --> Main[main.js]
    Core --> Utils[utils.js]
    Core --> DirUtils[directoryUtils.js]
    Core --> DirSelect[directorySelection.js]
    Core --> Log[log.js]
    
    Operations --> FileOp[fileOperations.js]
    Operations --> MoveOp[moveOperations.js]
    Operations --> CopyOp[copyOperations.js]
    Operations --> CreateFileOp[createFileOperations.js]
    Operations --> CreateFolderOp[createFolderOperations.js]
    Operations --> DeleteOp[deleteOperations.js]
    Operations --> HistoryOp[historyOperations.js]
    
    UI --> Focus[focus.js]
    UI --> CmdMode[commandMode.js]
    UI --> PaneSync[paneSync.js]
    UI --> PaneSwitch[paneSwitch.js]
    
    Events --> KeyEvents[keyEvents.js]
    Events --> KeyHandlers[keyHandlers.js]
    Events --> EventListeners[eventListeners.js]
```

### 3.2 モジュール依存関係

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
flowchart TD
    Main --> Utils
    Main --> DirUtils
    Main --> DirSelect
    Main --> Log
    
    FileOp --> Utils
    FileOp --> Log
    FileOp --> DirUtils
    
    MoveOp --> FileOp
    CopyOp --> FileOp
    CreateFileOp --> FileOp
    CreateFolderOp --> FileOp
    DeleteOp --> FileOp
    HistoryOp --> FileOp
    
    Focus --> FileOp
    Focus --> PaneSync
    Focus --> PaneSwitch
    
    CmdMode --> KeyEvents
    CmdMode --> Focus
    
    KeyEvents --> KeyHandlers
    KeyHandlers --> FileOp
    KeyHandlers --> Focus
    KeyHandlers --> CmdMode
    
    EventListeners --> KeyEvents
    EventListeners --> Focus
```

### 3.3 初期化シーケンス

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
flowchart TD
    Start([アプリケーション起動]) --> DOMLoaded[DOMContentLoaded]
    DOMLoaded --> InitMain[Main初期化]
    
    InitMain --> InitLog[log.js初期化]
    InitLog --> InitLogResize[ログリサイズ初期化]
    InitLogResize --> InitDirSelect[directorySelection.js初期化]
    
    InitDirSelect --> InitUtils[utils.js初期化]
    InitUtils --> InitDirUtils[directoryUtils.js初期化]
    
    InitDirUtils --> InitCreateOps[作成操作初期化]
    InitCreateOps --> InitCreateFolder[createFolderOperations.js初期化]
    InitCreateOps --> InitCreateFile[createFileOperations.js初期化]
    
    InitCreateFolder & InitCreateFile --> InitKeyEvents[keyEvents.js初期化]
    InitKeyEvents --> InitFocus[focus.js初期化]
    InitFocus --> InitCmdMode[commandMode.js初期化]
    
    InitCmdMode --> InitFileOps[ファイル操作初期化]
    InitFileOps --> InitFileOp[fileOperations.js初期化]
    InitFileOps --> InitCopyOp[copyOperations.js初期化]
    InitFileOps --> InitMoveOp[moveOperations.js初期化]
    InitFileOps --> InitDeleteOp[deleteOperations.js初期化]
    
    InitFileOp & InitCopyOp & InitMoveOp & InitDeleteOp --> InitPaneSync[paneSync.js初期化]
    InitPaneSync --> InitKeyHandlers[keyHandlers.js初期化]
    InitKeyHandlers --> InitEventListeners[eventListeners.js初期化]
    InitEventListeners --> InitPaneSwitch[paneSwitch.js初期化]
    InitPaneSwitch --> InitHistory[historyOperations.js初期化]
    InitHistory --> Ready[準備完了]
```

### 3.4 エラーハンドリング実装

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
graph TB
    Start([エラー発生]) --> CheckType{エラー種別}
    
    CheckType -->|ファイルシステム| FSError[ファイルシステムエラー]
    CheckType -->|操作| OpError[操作エラー]
    CheckType -->|UI| UIError[UI更新エラー]
    
    FSError --> FSAccess[アクセス権限エラー]
    FSError --> FSPath[パス不正エラー]
    FSError --> FSExists[存在確認エラー]
    
    OpError --> OpOverwrite[上書き確認]
    OpError --> OpDelete[削除確認]
    OpError --> OpParent[親ディレクトリ制限]
    
    UIError --> UIHandle[ハンドル更新エラー]
    UIError --> UIFocus[フォーカス更新エラー]
    
    FSAccess --> LogError[エラーログ記録]
    FSPath --> LogError
    FSExists --> LogError
    OpOverwrite -->|キャンセル| CancelOp[操作キャンセル]
    OpDelete -->|キャンセル| CancelOp
    OpParent --> LogError
    OpOverwrite -->|確認| ExecOp[操作実行]
    OpDelete -->|確認| ExecOp
    
    UIHandle --> LogError
    UIFocus --> LogError
    
    CancelOp --> ExitCmd[コマンドモード終了]
    LogError --> ExitCmd
    ExecOp --> UpdateUI[UI更新]
    UpdateUI --> ExitCmd
    
    ExitCmd --> End([処理完了])
```

* * *

## 4. 状態管理

### 4.1 アプリケーション状態

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
stateDiagram-v2
    [*] --> Initial: アプリケーション起動
    Initial --> BrowseDialog: フォルダ選択ダイアログ
    BrowseDialog --> FocusMode: ペイン反映/自動フォーカス
    
    state FocusMode {
        [*] --> ItemFocus: アイテムフォーカス
        ItemFocus --> DirNav: ディレクトリ移動
        ItemFocus --> ItemNav: アイテム間移動
        DirNav --> ItemFocus: フォーカス更新
        ItemNav --> ItemFocus: フォーカス更新
    }
    
    FocusMode --> CommandMode: コマンド入力
    CommandMode --> FocusMode: ESCキー
    CommandMode --> FileOperation: コマンド実行
    FileOperation --> FocusMode: 操作完了
    
    FocusMode --> ErrorState: エラー発生
    ErrorState --> FocusMode: エラー回復
    
    state CommandMode {
        [*] --> CmdInput: enableCommandMode
        CmdInput --> CmdExecuting: コマンド入力中
        CmdExecuting --> CmdInput: toggleCommandMode
    }
    
    state FileOperation {
        [*] --> HandleSetup: getSourceAndTargetHandles
        HandleSetup --> PathCheck: パス検証
        PathCheck --> Execute: ファイル操作実行
        Execute --> UIRefresh: refreshDirectoryHandle
        UIRefresh --> LoadContent: loadDirectoryContents
        LoadContent --> UpdateFocus: focusFileItem
    }
```

### 4.2 エラー処理

```mermaid
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
stateDiagram-v2
    [*] --> Normal: 通常操作
    Normal --> Error: エラー発生
    Error --> Logging: エラーログ記録
    Logging --> Recovery: リカバリー処理
    Recovery --> Normal: 正常復帰
    Recovery --> [*]: 致命的エラー
```

* * *

## 5. セキュリティ考慮事項

-   ファイルアクセス権限の確認
-   パス操作のバリデーション
-   エラー情報の適切な表示

* * *

## 6. パフォーマンス考慮事項

-   大規模ディレクトリの効率的な読み込み
-   UIの応答性確保
-   メモリ使用量の最適化