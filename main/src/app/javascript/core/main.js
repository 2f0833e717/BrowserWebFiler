class Main {
  constructor() {
    this.rootHandles = {
      left: null,
      right: null
    };
    this.currentHandles = {
      left: null,
      right: null
    };
    this.currentPaths = {
      left: '',
      right: ''
    };
    this.handles = {
      left: null,
      right: null
    };
    this.leftPane = document.querySelector('.left-pane .file-list');
    this.rightPane = document.querySelector('.right-pane .file-list');

    this.lastFocusedPane = null;
    this.lastFocusedIndexes = {
      left: 0,
      right: 0
    };
    this.commandMode = false;
    this.focusHistory = {
      left: new Map(),
      right: new Map()
    };

    // ログ機能の初期化
    initializeLog(this);
    this.initializeLogResize();

    // ディレクトリ選択の初期化（最初に必要）
    initializeDirectorySelection(this);

    // ユーティリティ関数の初期化（多くの機能で使用）
    initializeUtils(this);
    initializeDirectoryUtils(this);

    // フォルダとファイル作成機能の初期化
    initializeCreateFolderOperations(this);
    initializeCreateFileOperations(this);

    // キーイベントの初期化
    initializeKeyEvents(this);

    // フォーカス処理の初期化
    initializeFocus(this);

    // コマンドモードの初期化
    initializeCommandMode(this);

    // ヘルプ機能の初期化
    initializeHelp(this);

    // ファイルとフォルダの処理の初期化
    initializeFileOperations(this);
    initializeCopyOperations(this);
    initializeMoveOperations(this);

    // 削除操作の初期化
    initializeDeleteOperations(this);

    // ペイン同期の初期化
    initializePaneSync(this);

    // キーハンドルの処理の初期化
    initializeKeyHandlers(this);

    // イベントリスナーの初期化
    initializeEventListeners(this);

    // ペイン切り替えの初期化
    initializePaneSwitch(this);
    
    // 履歴機能の初期化
    initializeHistoryOperations(this);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
}); 