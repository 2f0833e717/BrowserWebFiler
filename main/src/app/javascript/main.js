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
    this.updatePathDisplay('left');
    this.updatePathDisplay('right');
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
    const targetPane = document.querySelector(`.${targetSide}-pane`);
    this.lastFocusedPane = targetPane;

    // 保存していたフォーカス位置を復元
    const items = Array.from(targetPane.querySelectorAll('.file-item'));
    if (items.length > 0) {
      const targetIndex = Math.min(this.lastFocusedIndexes[targetSide], items.length - 1);
      this.focusFileItem(items[targetIndex]);
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

  async loadDirectoryContentsCommon(side) {
    const handle = this.currentHandles[side];
    if (!handle) return;

    const pane = side === 'left' ? this.leftPane : this.rightPane;
    pane.innerHTML = '';

    // 親ディレクトリへの移動用の項目を追加
    const parentItem = document.createElement('div');
    parentItem.className = 'file-item';
    parentItem.innerHTML = `
      <span class="icon">📁</span>
      <span class="name">..</span>
    `;
    pane.appendChild(parentItem);

    const entries = [];
    for await (const entry of handle.values()) {
      entries.push(entry);
    }

    // ディレクトリとファイルを分けてソート
    const sortedEntries = entries.sort((a, b) => {
      if (a.kind === b.kind) {
        return a.name.localeCompare(b.name);
      }
      return a.kind === 'directory' ? -1 : 1;
    });

    for (const entry of sortedEntries) {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span class="icon">${entry.kind === 'directory' ? '📁' : '📄'}</span>
        <span class="name">${entry.name}</span>
      `;
      pane.appendChild(item);
    }

    return pane;
  }

  async loadDirectoryContents(side) {
    try {
      const pane = await this.loadDirectoryContentsCommon(side);

      // ディレクトリ読み込み後、フォーカスを設定
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        // 保存されたフォーカス位置があればそれを使用、なければ最初のアイテム
        const savedIndex = this.focusHistory[side].get(this.currentPaths[side]);
        const targetIndex = savedIndex !== undefined ? 
          Math.min(savedIndex, items.length - 1) : 0;
        
        this.focusFileItem(items[targetIndex]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = targetIndex;
      }
    } catch (error) {
      this.logError(error);
    }
  }

  async loadDirectoryContentsWithoutFocus(side) {
    try {
      await this.loadDirectoryContentsCommon(side);
    } catch (error) {
      this.logError(error);
    }
  }

  updatePathDisplay(side) {
    const pathElement = document.querySelector(`.path-${side} .current-path`);
    pathElement.textContent = this.currentPaths[side] || '';
  }

  renderFileList(pane, entries) {
    pane.innerHTML = '';
    // 「..」追加
    const upEntry = { name: '..', isDirectory: true };
    entries.unshift(upEntry);
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).forEach(entry => {
      const element = document.createElement('div');
      element.className = 'file-item';
      element.innerHTML = `
        <span class="icon">${entry.isDirectory ? '📁' : '📄'}</span>
        <span class="name">${entry.name}</span>
      `;
      pane.appendChild(element);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});

