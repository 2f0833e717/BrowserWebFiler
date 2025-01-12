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
    this.lastFocusedIndexes = {
      left: 0,
      right: 0
    };
    this.initializeLogResize();
    this.commandMode = false;  // コマンドモードの状態管理を追加
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
      const focusedItem = document.querySelector('.file-item.focused, .file-item.command-focused');
      if (!focusedItem) return;

      switch (e.key) {
        case ' ': // スペースキー
          this.toggleCommandMode(focusedItem);
          e.preventDefault();
          break;

        case 'm':
          if (this.commandMode) {
            // コマンドモード中のmキーでファイル移動
            await this.moveFile(focusedItem);
          } else {
            // 通常モード中のmキーでコマンドモードに移行
            this.enableCommandMode(focusedItem);
          }
          e.preventDefault();
          break;

        case 'Enter':
          if (focusedItem && !this.commandMode) {
            const pane = focusedItem.closest('.pane');
            const side = pane.classList.contains('left-pane') ? 'left' : 'right';
            const itemName = focusedItem.querySelector('.name').textContent;
            if (itemName === '..') {
              await this.navigateUp(side);
            } else {
              await this.openDirectory(side, itemName);
            }
          }
          break;

        case 'Escape':
          if (this.commandMode) {
            this.exitCommandMode();
          }
          break;

        case 'ArrowLeft':
          if (!this.commandMode) {
            if (this.lastFocusedPane && this.lastFocusedPane.classList.contains('right-pane')) {
              this.switchPane('left');
            } else {
              await this.navigateUp('left');
            }
          }
          break;

        case 'ArrowRight':
          if (!this.commandMode) {
            if (this.lastFocusedPane && this.lastFocusedPane.classList.contains('left-pane')) {
              this.switchPane('right');
            } else if (this.lastFocusedPane && this.lastFocusedPane.classList.contains('right-pane')) {
              await this.navigateUp('right');
            }
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
          if (!this.commandMode) {
            this.handleArrowKeys(e.key);
          }
          break;

        case 'PageUp':
          if (!this.commandMode) {
            this.handlePageKey('first');
          }
          break;

        case 'PageDown':
          if (!this.commandMode) {
            this.handlePageKey('last');
          }
          break;
      }
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

  handleArrowKeys(key) {
    const pane = this.lastFocusedPane || document.querySelector('.left-pane');
    const items = Array.from(pane.querySelectorAll('.file-item'));
    const currentFocusedIndex = items.findIndex(item => item.classList.contains('focused'));
    
    let newIndex = currentFocusedIndex;
    if (key === 'ArrowUp') {
      // 上キーの場合、一番上なら移動しない
      if (currentFocusedIndex > 0) {
        newIndex = currentFocusedIndex - 1;
      }
    } else {
      // 下キーの場合、一番下なら移動しない
      if (currentFocusedIndex < items.length - 1) {
        newIndex = currentFocusedIndex + 1;
      }
    }

    if (items[newIndex] && newIndex !== currentFocusedIndex) {
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      this.lastFocusedIndexes[side] = newIndex;
      this.focusFileItem(items[newIndex]);
    }
  }

  // PageUp/PageDownの処理を追加
  handlePageKey(position) {
    const pane = this.lastFocusedPane || document.querySelector('.left-pane');
    const items = Array.from(pane.querySelectorAll('.file-item'));
    if (items.length === 0) return;

    const newIndex = position === 'first' ? 0 : items.length - 1;
    const side = pane.classList.contains('left-pane') ? 'left' : 'right';
    
    this.lastFocusedIndexes[side] = newIndex;
    this.focusFileItem(items[newIndex]);
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
      
      // フォルダ内に移動した後、最初のアイテムにフォーカスを設定
      const pane = side === 'left' ? this.leftPane : this.rightPane;
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        // lastFocusedPaneとlastFocusedIndexesも更新
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
      }
      
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

      // 一つ上の階層に移動した後、最初のアイテムにフォーカスを設定
      const pane = side === 'left' ? this.leftPane : this.rightPane;
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        // lastFocusedPaneとlastFocusedIndexesも更新
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
      }

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
    document.querySelectorAll('.file-item').forEach(el => {
      el.classList.remove('focused');
      el.classList.remove('command-focused');
    });
    item.classList.add(this.commandMode ? 'command-focused' : 'focused');
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

  initializeLogResize() {
    const logContainer = document.querySelector('.log-container');
    const logHeader = document.querySelector('.log-header');
    let isDragging = false;
    let startY;
    let startHeight;

    logHeader.addEventListener('mousedown', (e) => {
      // ヘッダーの上部5pxの領域でのみドラッグを開始
      if (e.offsetY <= 10) {
        isDragging = true;
        startY = e.clientY;
        startHeight = logContainer.offsetHeight;
        document.body.style.cursor = 'ns-resize';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const newHeight = Math.min(
        Math.max(startHeight + deltaY, 0), // 最小高さ100px
        window.innerHeight * 1 // 最大高さ画面の80%
      );

      logContainer.style.height = `${newHeight}px`;
      document.querySelector('.app-container').style.paddingBottom = `${newHeight}px`;
      document.querySelector('.file-manager').style.height = 
        `calc(100vh - ${newHeight}px - 50px)`;

      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    });

    // ダブルクリックで高さをデフォルトに戻す
    logHeader.addEventListener('dblclick', (e) => {
      if (e.offsetY <= 10) {
        const defaultHeight = window.innerHeight * 0.2; // 20vh
        logContainer.style.height = `${defaultHeight}px`;
        document.querySelector('.app-container').style.paddingBottom = `${defaultHeight}px`;
        document.querySelector('.file-manager').style.height = 
          `calc(100vh - ${defaultHeight}px - 50px)`;
      }
    });
  }

  async moveFile(item) {
    if (!item) return;

    try {
      const sourceName = item.querySelector('.name').textContent;
      if (sourceName === '..') {
        this.logMessage('親ディレクトリは移動できません');
        this.exitCommandMode();
        return;
      }

      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';
      
      const isDirectory = item.querySelector('.icon').textContent.includes('📁');

      // 移動元と移動先のハンドルを取得
      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('移動元または移動先のディレクトリが選択されていません');
      }

      if (isDirectory) {
        // フォルダの移動処理
        const sourceDir = await sourceHandle.getDirectoryHandle(sourceName);
        await this.moveDirectory(sourceDir, targetHandle, sourceName);
        // 元のフォルダを削除
        await sourceHandle.removeEntry(sourceName, { recursive: true });
      } else {
        // ファイルの移動処理
        const sourceFile = await sourceHandle.getFileHandle(sourceName);
        const targetFile = await targetHandle.getFileHandle(sourceName, { create: true });
        
        const file = await sourceFile.getFile();
        const writable = await targetFile.createWritable();
        await writable.write(file);
        await writable.close();
        
        // 元のファイルを削除
        await sourceHandle.removeEntry(sourceName);
      }

      // 両方のペインを更新
      await this.loadDirectoryContents(sourceSide);
      await this.loadDirectoryContents(targetSide);

      // フォーカスを維持
      const targetPane = document.querySelector(`.${targetSide}-pane`);
      const items = Array.from(targetPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        this.lastFocusedPane = targetPane;
      }

      this.logMessage(`${sourceName}を${sourceSide}から${targetSide}に移動しました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  }

  async moveDirectory(sourceDir, targetParent, dirName) {
    // フォルダの再帰的な移動処理
    const newDir = await targetParent.getDirectoryHandle(dirName, { create: true });
    
    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const newFile = await newDir.getFileHandle(entry.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        await this.moveDirectory(entry, newDir, entry.name);
      }
    }
  }

  // コマンドモードを有効にする
  enableCommandMode(item) {
    if (!item) return;
    
    this.commandMode = true;
    item.classList.remove('focused');
    item.classList.add('command-focused');
  }

  // スペースキーでのコマンドモード切り替え
  toggleCommandMode(item) {
    if (!item) return;
    
    this.commandMode = !this.commandMode;
    if (this.commandMode) {
      item.classList.remove('focused');
      item.classList.add('command-focused');
    } else {
      item.classList.remove('command-focused');
      item.classList.add('focused');
    }
  }

  exitCommandMode() {
    const commandFocusedItem = document.querySelector('.file-item.command-focused');
    if (commandFocusedItem) {
      commandFocusedItem.classList.remove('command-focused');
      commandFocusedItem.classList.add('focused');
      this.commandMode = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});