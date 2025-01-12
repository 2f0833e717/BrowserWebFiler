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
      left: '',  // 空文字列に変更
      right: ''  // 空文字列に変更
    };
    this.handles = {
      left: null,
      right: null
    };
    this.leftPane = document.querySelector('.left-pane .file-list');
    this.rightPane = document.querySelector('.right-pane .file-list');
    
    if (!('showDirectoryPicker' in window)) {
      this.logError(new Error('このブラウザはFile System Access APIをサポートしていません。'));
      return;
    }
    
    this.initializeEventListeners();
    this.updatePathDisplay('left');
    this.updatePathDisplay('right');
    this.lastFocusedPane = null; // フォーカスされているペインを追跡
  }

  initializeEventListeners() {
    // ディレクトリ選択ボタン
    document.querySelectorAll('.btn.select-dir').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pane = e.target.closest('.pane');
        const side = pane.classList.contains('left-pane') ? 'left' : 'right';
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
            await this.navigateUp(side);
          } else {
            await this.openDirectory(side, itemName);
          }
        }
      });
    });

    // キーボードイベントを更新
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const focusedItem = document.querySelector('.file-item.focused');
        if (focusedItem) {
          const pane = focusedItem.closest('.pane');
          const side = pane.classList.contains('left-pane') ? 'left' : 'right';
          const itemName = focusedItem.querySelector('.name').textContent;
          if (itemName === '..') {
            await this.navigateUp(side);
          } else {
            await this.openDirectory(side, itemName);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        await this.navigateUp('left');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        this.handleArrowKeys(e.key);
      }
    });

    // ペインのクリックでフォーカスを設定
    document.querySelectorAll('.pane').forEach(pane => {
      pane.addEventListener('click', () => {
        this.lastFocusedPane = pane;
      });
    });
  }

  handleArrowKeys(key) {
    const pane = this.lastFocusedPane || document.querySelector('.left-pane');
    const items = Array.from(pane.querySelectorAll('.file-item'));
    const currentFocusedIndex = items.findIndex(item => item.classList.contains('focused'));
    
    let newIndex;
    if (key === 'ArrowUp') {
      newIndex = currentFocusedIndex > 0 ? currentFocusedIndex - 1 : items.length - 1;
    } else {
      newIndex = currentFocusedIndex < items.length - 1 ? currentFocusedIndex + 1 : 0;
    }

    if (items[newIndex]) {
      this.focusFileItem(items[newIndex]);
    }
  }

  async selectDirectory(side) {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      // ルートハンドルとして保存
      this.rootHandles[side] = handle;
      this.currentHandles[side] = handle;
      
      // パスを設定
      this.currentPaths[side] = handle.name;
      
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      this.logMessage(`選択されたディレクトリ: ${handle.name}`);
    } catch (error) {
      this.logError(error);
    }
  }

  async openDirectory(side, itemName) {
    try {
      const handle = this.currentHandles[side];
      if (!handle) return;

      const newHandle = await handle.getDirectoryHandle(itemName);
      this.currentHandles[side] = newHandle;
      
      // 新しいディレクトリの名前を使用
      const path = `${this.currentPaths[side]}\\${itemName}`;
      
      this.currentPaths[side] = path;
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      // ログにフルパスを表示
      this.logMessage(`移動したディレクトリ: ${path}`);
    } catch (error) {
      this.logError(error);
    }
  }

  async navigateUp(side) {
    try {
      const currentHandle = this.currentHandles[side];
      if (!currentHandle) return;

      // ルートディレクトリに到達した場合は移動しない
      if (currentHandle === this.rootHandles[side]) {
        this.logMessage('ルートディレクトリです');
        return;
      }

      // 現在のパスから親ディレクトリのパスを生成
      const currentPath = this.currentPaths[side];
      const pathParts = currentPath.split('\\');
      pathParts.pop();
      const parentPath = pathParts.join('\\');

      // 新しいディレクトリを取得
      let newHandle = this.rootHandles[side];
      
      // ルート以外の場合は該当パスまで移動
      for (const part of pathParts.slice(1)) {
        try {
          newHandle = await newHandle.getDirectoryHandle(part);
        } catch (error) {
          this.logError(new Error(`ディレクトリの取得に失敗しました: ${part}`));
          return;
        }
      }
      
      // 成功した場合のみハンドルとパスを更新
      this.currentHandles[side] = newHandle;
      this.currentPaths[side] = parentPath;

      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);

      this.logMessage(`上の階層に移動: ${parentPath}`);
    } catch (error) {
      this.logError(error);
    }
  }

  async getDirectoryHandleByPath(path) {
    // パスからディレクトリハンドルを取得するロジックを実装
    const parts = path.split('\\');
    let handle = await window.showDirectoryPicker();
    for (const part of parts) {
      if (part) {
        handle = await handle.getDirectoryHandle(part);
      }
    }
    return handle;
  }

  async loadDirectoryContents(side) {
    try {
      const handle = this.currentHandles[side];
      if (!handle) return;

      const entries = [];
      for await (const entry of handle.values()) {
        entries.push({
          name: entry.name,
          isDirectory: entry.kind === 'directory'
        });
      }

      const pane = side === 'left' ? this.leftPane : this.rightPane;
      this.renderFileList(pane, entries);
    } catch (error) {
      this.logError(error);
    }
  }

  focusFileItem(item) {
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('focused'));
    item.classList.add('focused');
    item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  updatePathDisplay(side) {
    const pathElement = document.querySelector(`.path-${side} .current-path`);
    pathElement.textContent = this.currentPaths[side] || '';
  }

  renderFileList(pane, entries) {
    pane.innerHTML = '';
    // 一つ上の階層に移動するための「..」を追加
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

  logError(error) {
    console.error(error);
    const logContent = document.querySelector('.log-content');
    const errorElement = document.createElement('div');
    errorElement.textContent = `Error: ${error.message}`;
    logContent.appendChild(errorElement);
  }

  logMessage(message) {
    const logContent = document.querySelector('.log-content');
    const messageElement = document.createElement('div');
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${now.getMilliseconds()}`;
    messageElement.textContent = `${timestamp} - ${message}`;
    logContent.appendChild(messageElement);
    // 最新のログが見えるようにスクロール
    logContent.scrollTop = logContent.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});