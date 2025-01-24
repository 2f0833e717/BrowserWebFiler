---
marp: true
theme: default
paginate: true
style: |
  section {
    background-color: #1a1a1a;
    color: #ffffff;
  }
  h1, h2, h3, h4 {
    color: #4a9eff;
  }
  code {
    background-color: #ffffff;
  }
  .mermaid {
    font-size: 10px;
    background-color: #2d2d2d;
    transform: scale(0.8);
    transform-origin: top left;
    margin: 0 auto;
    max-width: 100%;
    max-height: 60vh;
    overflow: auto;
  }
  pre.mermaid {
    margin: 0 auto;
    text-align: center;
    width: 100%;
  }
  .mermaid .label {
    font-size: 16px;
    color: #000000;
  }
  .mermaid .node-text {
    font-size: 16px;
    color: #000000;
  }
  .mermaid .edgeLabel {
    font-size: 16px;
    color: #000000;
    background-color: ##c2ffd9;
  }
  .mermaid rect {
    fill: #000000;
    stroke: #6a9eff;
  }
  .mermaid path {
    stroke: #6a9eff;
  }
  .mermaid .node rect {
    fill: #000000;
    stroke: #6a9eff;
  }
  .mermaid .node circle {
    fill: #000000;
    stroke: #6a9eff;
  }
  .mermaid .node polygon {
    fill: #000000;
    stroke: #6a9eff;
  }
  .mermaid .node .label {
    color: #ffffff;
  }
  .mermaid .nodeLabel {
    color: #ffffff;
  }
  .mermaid .edgePath .path {
    stroke: #6a9eff;
  }
  .mermaid .edgePath marker {
    fill: #6a9eff;
  }
---
<!-- 上記はMarpと認識させるために必要な記述 -->

<!-- Mermaidのレンダリングについての記事 -->
<!-- https://qiita.com/hirokiwa/items/1a792f4f87a77dd2c930#%E3%81%BE%E3%81%A8%E3%82%81 -->

<!-- preタグ内にMermaid記法で出力したい図のコードを書く -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@9"></script>
<script>mermaid.initialize({startOnLoad: true});</script>

# Web File Manager 設計書

## 目次

1. システム概要

2. システムフロー
   - 2.1 メインフロー
   - 2.2 ファイル操作フロー
   - 2.3 イベント処理フロー
     - 2.3.1 キーボードイベントフロー
     - 2.3.2 フォーカス管理フロー
     - 2.3.3 ペイン操作フロー

* * *

   - 2.4 UI更新フロー
   - 2.5 エラー処理フロー

3. 実装設計
   - 3.1 ディレクトリ構成
   - 3.2 モジュール依存関係
   - 3.3 初期化シーケンス
   - 3.4 エラーハンドリング実装

* * *

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

* * *

### 2.1 メインフロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
</pre>

* * *

### 2.2 ファイル操作フロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
    
    Log --> End
</pre>

* * *

### 2.3 イベント処理フロー

* * *

#### 2.3.1 キーボードイベントフロー

<pre class="mermaid">
%%{ init: { 
    "flowchart": { 
        "defaultRenderer": "elk",
        "rankSpacing": 80,
        "nodeSpacing": 30,
        "orientation": "TB"
    }
} }%%
flowchart TD
    Start([キーイベント発生]) --> CheckMode{モード確認}
    
    CheckMode -->|通常モード| NormalKeys{キー種別}
    CheckMode -->|履歴表示モード| HistoryKeys{キー種別}
    
    NormalKeys -->|上下キー| MoveFocus[フォーカス上下移動]
    NormalKeys -->|PageUp/Down| PageMove[フォーカス最上最下移動]
    NormalKeys -->|左右キー| PaneSwitch[ペイン切替]
    NormalKeys -->|Enter| DirEnterFromNomal[ディレクトリ移動]
    NormalKeys -->|Shift+o| SyncPane[ペイン同期]
    NormalKeys -->|Space| CmdModeOn[コマンドモード開始]
    NormalKeys -->|m| CmdModeOn
    NormalKeys -->|c| CmdModeOn
    NormalKeys -->|d| CmdModeOn
    
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
    
    MoveFocus --> UpdateFocus[フォーカス更新]
    PageMove --> UpdateFocus
    UpdateFocus --> NormalKeys
    PaneSwitch --> UpdatePane[アクティブペイン更新]
    DirEnterFromNomal --> LoadDirFromNomal[ディレクトリ読み込み]
    DirEnterFromHistory --> LoadDirFromHistory[ディレクトリ読み込み]
    
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
    
    HistorySelect --> UpdateHistoryUI[履歴UI更新]
    PageUpDownHistory --> UpdateHistoryUI
    UpdateHistoryUI --> HistoryKeys
    
    SyncPane --> LoadSync[同期処理]
    LoadDirFromNomal --> UpdateUI[UI更新]
    LoadDirFromHistory --> UpdateUI
    
    CmdModeOff --> UpdateUI
    ToggleCmd --> UpdateUI
    
    CloseHistory --> UpdateUI
    
    UpdatePane --> UpdateUI
    LoadSync --> UpdateUI
    ExecMove --> UpdateUI
    CancelMove --> UpdateUI
    ExecCopy --> UpdateUI
    CancelCopy --> UpdateUI
    ExecDelete --> UpdateUI
    CancelDelete --> UpdateUI
    UpdateUI --> LogOp[操作ログ記録]
    LogOp --> End([処理完了])
</pre>

* * *

#### 2.3.2 フォーカス管理フロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
flowchart TD
    Start([フォーカスイベント]) --> FocusCheck{フォーカス種別}
    
    FocusCheck -->|左ペイン| LeftFocus[左ペインフォーカス]
    FocusCheck -->|右ペイン| RightFocus[右ペインフォーカス]
    FocusCheck -->|コマンド| CmdFocus[コマンドフォーカス]
    
    LeftFocus --> SaveState[状態保存]
    RightFocus --> SaveState
    CmdFocus --> SaveState
    
    SaveState --> UpdateFocus[フォーカス更新]
    UpdateFocus --> UpdateUI[UI更新]
    UpdateUI --> Log[ログ記録]
    Log --> End([処理完了])
</pre>

* * *

#### 2.3.3 ペイン操作フロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
flowchart TD
    Start([ペイン操作]) --> PaneCheck{操作種別}
    
    PaneCheck --> MoveFocus[フォーカス移動]
    PaneCheck --> SyncCheck{同期方向}
    
    SyncCheck --> LeftToRight[左から右へ同期]
    SyncCheck --> RightToLeft[右から左へ同期]
    
    MoveFocus --> SaveFocus[フォーカス状態保存]
    LeftToRight --> UpdatePane[ペイン更新]
    RightToLeft --> UpdatePane
    
    SaveFocus --> UpdateUI[UI更新]
    UpdatePane --> UpdateUI
    UpdateUI --> UpdatePath[パス表示更新]
    UpdatePath --> Log[ログ記録]
    Log --> End([処理完了])
</pre>

* * *

### 2.4 UI更新フロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
flowchart TD
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
</pre>

* * *

### 2.5 エラー処理フロー

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
flowchart TD
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
    
    FSAccess & FSPath & FSExists --> LogError[エラーログ記録]
    OpOverwrite --> |キャンセル| CancelOp[操作キャンセル]
    OpDelete --> |キャンセル| CancelOp
    OpParent --> LogError
    OpOverwrite --> |確認| ExecOp[操作実行]
    OpDelete --> |確認| ExecOp
    
    UIHandle & UIFocus --> LogError
    
    CancelOp --> ExitCmd[コマンドモード終了]
    LogError --> ExitCmd
    ExecOp --> UpdateUI[UI更新]
    UpdateUI --> ExitCmd
    
    ExitCmd --> End([処理完了])
</pre>

* * *

## 3. 実装設計

* * *

### 3.1 ディレクトリ構成

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
flowchart LR
    Root[src/app/javascript] --> Core[core]
    Root --> Operations[operations]
    Root --> UI[ui]
    Root --> Events[events]
    
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
</pre>

* * *

### 3.2 モジュール依存関係

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
</pre>

* * *

### 3.3 初期化シーケンス

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
</pre>

* * *

### 3.4 エラーハンドリング実装

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
    
    FSAccess & FSPath & FSExists --> LogError[エラーログ記録]
    OpOverwrite --> |キャンセル| CancelOp[操作キャンセル]
    OpDelete --> |キャンセル| CancelOp
    OpParent --> LogError
    OpOverwrite --> |確認| ExecOp[操作実行]
    OpDelete --> |確認| ExecOp
    
    UIHandle & UIFocus --> LogError
    
    CancelOp --> ExitCmd[コマンドモード終了]
    LogError --> ExitCmd
    ExecOp --> UpdateUI[UI更新]
    UpdateUI --> ExitCmd
    
    ExitCmd --> End([処理完了])
</pre>

* * *

## 4. 状態管理

* * *

### 4.1 アプリケーション状態

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
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
</pre>

* * *

### 4.2 エラー処理

<pre class="mermaid">
%%{ init: { 
    'flowchart': { 
        'defaultRenderer': 'elk',
        'rankSpacing': 80,
        'nodeSpacing': 30,
        'orientation': 'TB'
    }
} }%%
stateDiagram-v2
    [*] --> Normal: 通常操作
    Normal --> Error: エラー発生
    Error --> Logging: エラーログ記録
    Logging --> Recovery: リカバリー処理
    Recovery --> Normal: 正常復帰
    Recovery --> [*]: 致命的エラー
</pre>

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

* * *

以上
