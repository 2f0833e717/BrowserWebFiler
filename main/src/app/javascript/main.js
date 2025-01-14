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
    
    this.initializeEventListeners();
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

    // キーイベントの初期化
    initializeKeyEvents(this);

    // フォーカス処理の初期化
    initializeFocus(this);

    // コマンドモードの初期化
    initializeCommandMode(this);

    // ファイルとフォルダの処理の初期化
    initializeFileOperations(this);

    // ペイン同期の初期化
    initializePaneSync(this);

    // キーハンドルの処理の初期化
    initializeKeyHandlers(this);

    // ユーティリティ関数の初期化
    initializeUtils(this);
    initializeDirectoryUtils(this);
  }

  initializeEventListeners() {
    // ディレクトリ選択ボタン
    document.querySelectorAll('.btn.select-dir').forEach(btn => {
      // mousedownイベントでフォーカスを防ぐ
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const pane = e.target.closest('.pane');
        const side = pane.classList.contains('left-pane') ? 'left' : 'right';
        btn.blur(); // フォーカスを外す
        await this.selectDirectory(side);
      });
    });

    // ファイルリストのクリックイベント
    document.querySelectorAll('.file-list').forEach(list => {
      list.addEventListener('click', (e) => {
        const item = e.target.closest('.file-item');
        if (item) {
          this.focusFileItem(item);
        }
      });
    });

    // ダブルクリックイベント
    document.querySelectorAll('.file-list').forEach(list => {
      list.addEventListener('dblclick', async (e) => {
        const item = e.target.closest('.file-item');
        if (item) {
          const pane = e.target.closest('.pane');
          const side = pane.classList.contains('left-pane') ? 'left' : 'right';
          const itemName = item.querySelector('.name').textContent;
          if (itemName === '..') {
            await this.changeParentDirectory(side);
          } else {
            await this.changeDirectory(side, itemName);
          }
        }
      });
    });

    // ペインのクリックでフォーカスを設定
    document.querySelectorAll('.pane').forEach(pane => {
      pane.addEventListener('click', () => {
        const side = pane.classList.contains('left-pane') ? 'left' : 'right';
        this.switchPane(side);
      });
    });
  }

  switchPane(targetSide) {
    // 現在のフォーカス位置を保存
    if (this.lastFocusedPane) {
      const currentSide = this.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
      const items = Array.from(this.lastFocusedPane.querySelectorAll('.file-item'));
      const currentIndex = items.findIndex(item => item.classList.contains('focused'));
      if (currentIndex !== -1) {
        this.lastFocusedIndexes[currentSide] = currentIndex;
      }
    }

    // 対象のペインに切り替え
    const targetPane = document.querySelector(`.${targetSide}-pane .file-list`);
    this.lastFocusedPane = targetPane;

    // 保存していたフォーカス位置を復元
    const items = Array.from(targetPane.querySelectorAll('.file-item'));
    if (items.length > 0) {
      const targetIndex = Math.min(this.lastFocusedIndexes[targetSide], items.length - 1);
      this.focusFileItem(items[targetIndex]);

      // フォーカス表示を更新
      document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('focused');
      });
      if (items[targetIndex]) {
        items[targetIndex].classList.add('focused');
      }
    }
  }

  async selectDirectory(side) {
    try {
      if (this.currentHandles[side]) {
        this.saveFocusPosition(side);
      }

      const handle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      this.rootHandles[side] = handle;
      this.currentHandles[side] = handle;
      
      this.currentPaths[side] = handle.name;
      
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      this.restoreFocusPosition(side);
      
      this.logMessage(`選択されたディレクトリ: ${handle.name}`);
    } catch (error) {
      this.logError(error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});

