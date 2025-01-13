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
    this.initializeLogResize();
    this.commandMode = false;
    this.focusHistory = {
      left: new Map(),
      right: new Map()
    };
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

    // キーボードイベントを更新
    document.addEventListener('keydown', async (e) => {
      const focusedItem = document.querySelector('.file-item.focused, .file-item.command-focused');
      if (!focusedItem) return;

      switch (e.key) {
        case ' ':
          this.toggleCommandMode(focusedItem);
          e.preventDefault();
          break;

        case 'm':
          if (this.commandMode) {
            await this.moveFile(focusedItem);
          } else {
            this.enableCommandMode(focusedItem);
          }
          e.preventDefault();
          break;

        case 'c':
          if (this.commandMode) {
            const itemName = focusedItem.querySelector('.name').textContent;
            const isDirectory = focusedItem.querySelector('.icon').textContent.includes('📁');
            if (isDirectory) {
              await this.copyDirectory(focusedItem);
            } else {
              await this.copyFile(focusedItem);
            }
          } else {
            this.enableCommandMode(focusedItem);
          }
          e.preventDefault();
          break;

        case 'd':
          if (this.commandMode) {
            await this.deleteFileOrDirectory(focusedItem);
          } else {
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
              await this.changeParentDirectory(side);
            } else {
              await this.changeDirectory(side, itemName);
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
              await this.changeParentDirectory('left');
            }
          }
          break;

        case 'ArrowRight':
          if (!this.commandMode) {
            if (this.lastFocusedPane && this.lastFocusedPane.classList.contains('left-pane')) {
              this.switchPane('right');
            } else if (this.lastFocusedPane && this.lastFocusedPane.classList.contains('right-pane')) {
              await this.changeParentDirectory('right');
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

        case 'O':
          if (e.shiftKey) {
            const pane = focusedItem.closest('.pane');
            const side = pane.classList.contains('left-pane') ? 'left' : 'right';
            const targetSide = side === 'left' ? 'right' : 'left';
            await this.mirrorDirectory(side, targetSide);
            e.preventDefault();
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
      // 上移動不可
      if (currentFocusedIndex > 0) {
        newIndex = currentFocusedIndex - 1;
      }
    } else {
      // 下移動不可
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

  // PageUp/PageDown
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

  async changeDirectory(side, itemName) {
    try {
      this.saveFocusPosition(side);

      const handle = this.currentHandles[side];
      if (!handle) return;

      const newHandle = await handle.getDirectoryHandle(itemName);
      this.currentHandles[side] = newHandle;
      
      const path = `${this.currentPaths[side]}\\${itemName}`;
      
      this.currentPaths[side] = path;
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      this.restoreFocusPosition(side);
      
      this.logMessage(`移動したディレクトリ: ${path}`);
    } catch (error) {
      this.logError(error);
    }
  }

  async changeParentDirectory(side) {
    try {
      const currentHandle = this.currentHandles[side];
      if (!currentHandle) return;

      // 現在のディレクトリ名を取得（戻った後にこの位置にフォーカスを合わせるため）
      const currentPathParts = this.currentPaths[side].split('\\').filter(part => part);
      const currentDirName = currentPathParts[currentPathParts.length - 1];

      // パスの正規化と完全パスの構築
      let currentPath = this.currentPaths[side].replace(/^\\+/, '');
      
      // ルートディレクトリから開始していない場合、完全パスを構築
      if (!this.currentPaths[side].includes(this.rootHandles[side].name)) {
        const rootName = this.rootHandles[side].name;
        if (!currentPath.startsWith(rootName)) {
          currentPath = `${rootName}\\${currentPath}`;
        }
      }

      const pathParts = currentPath.split('\\').filter(part => part);
      console.log('現在のパス:', currentPath);
      console.log('パス要素:', pathParts);

      // ルートディレクトリの判定
      if (currentHandle === this.rootHandles[side] && pathParts.length <= 1) {
        this.logMessage('ルートディレクトリから先の階層へは移動できません。');
        return;
      }

      // 移動前のフォーカス位置を保存
      this.saveFocusPosition(side);

      // 親ディレクトリのパスを生成
      const parentPathParts = pathParts.slice(0, -1);
      const parentPath = parentPathParts.join('\\');
      console.log('親ディレクトリパス:', parentPath);

      // ルートディレクトリへの移動
      if (parentPathParts.length === 0 || 
          (parentPathParts.length === 1 && parentPathParts[0] === this.rootHandles[side].name)) {
        this.currentHandles[side] = this.rootHandles[side];
        this.currentPaths[side] = this.rootHandles[side].name;
      } else {
        let newHandle = this.rootHandles[side];
        
        // 目的のディレクトリまで順番に移動
        for (const part of parentPathParts) {
          if (part === this.rootHandles[side].name) continue;
          console.log('移動中のパス:', part);
          try {
            newHandle = await newHandle.getDirectoryHandle(part);
          } catch (error) {
            this.logError(new Error(`ディレクトリの取得に失敗: ${part}`));
            return;
          }
        }

        this.currentHandles[side] = newHandle;
        this.currentPaths[side] = parentPath || this.rootHandles[side].name;
      }

      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);

      // 親ディレクトリでの移動元ディレクトリ名の位置にフォーカスを設定
      const pane = side === 'left' ? this.leftPane : this.rightPane;
      const items = Array.from(pane.querySelectorAll('.file-item'));
      const targetItem = items.find(item => 
        item.querySelector('.name').textContent === currentDirName
      );

      if (targetItem) {
        this.focusFileItem(targetItem);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = items.indexOf(targetItem);
        console.log(`移動元ディレクトリにフォーカス - ${side}:`, currentDirName);
      } else {
        // 移動元ディレクトリが見つからない場合は保存されていた位置を復元
        this.restoreFocusPosition(side);
      }

      this.logMessage(`移動したディレクトリ: ${this.currentPaths[side]}`);
    } catch (error) {
      this.logError(error);
    }
  }

  async getDirectoryHandleByPath(path) {
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

  focusFileItem(item) {
    if (!item) return;

    // 既存のフォーカスを解除
    document.querySelectorAll('.file-item.focused, .file-item.command-focused').forEach(el => {
      el.classList.remove('focused', 'command-focused');
    });

    // 新しいフォーカスを設定
    if (this.commandMode) {
      item.classList.add('command-focused');
    } else {
      item.classList.add('focused');
    }

    // ペインのフォーカス状態を更新
    const pane = item.closest('.pane');
    if (pane) {
      this.lastFocusedPane = pane;
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const items = Array.from(pane.querySelectorAll('.file-item'));
      this.lastFocusedIndexes[side] = items.indexOf(item);
    }

    // スクロール位置の調整
    item.scrollIntoView({ block: 'nearest' });
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
    logContent.scrollTop = logContent.scrollHeight;
  }

  initializeLogResize() {
    const logContainer = document.querySelector('.log-container');
    const logHeader = document.querySelector('.log-header');
    let isDragging = false;
    let startY;
    let startHeight;

    logHeader.addEventListener('mousedown', (e) => {
      // ヘッダーの上部領域でドラッグ
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
        window.innerHeight * 1 // 最大高さ画面80%
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

    // ダブルクリックで高さデフォルト
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

  // コマンドモード
  enableCommandMode(item) {
    if (!item) return;
    
    this.commandMode = true;
    item.classList.remove('focused');
    item.classList.add('command-focused');
  }

  // コマンドモード切替
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
    // コマンドモード終了
    const commandFocusedItem = document.querySelector('.file-item.command-focused');
    if (commandFocusedItem) {
      commandFocusedItem.classList.remove('command-focused');
      commandFocusedItem.classList.add('focused');
      this.commandMode = false;
    }
  }

  async mirrorDirectory(sourceSide, targetSide) {
    try {
      const sourceHandle = this.currentHandles[sourceSide];
      if (!sourceHandle) {
        throw new Error('ミラー元のディレクトリが選択されていません');
      }

      // ターゲット側のルートハンドルと現在のハンドルを更新
      this.rootHandles[targetSide] = this.rootHandles[sourceSide];
      this.currentHandles[targetSide] = sourceHandle;
      this.currentPaths[targetSide] = this.currentPaths[sourceSide];

      await this.loadDirectoryContents(targetSide);
      this.updatePathDisplay(targetSide);

      this.logMessage(`${sourceSide}ペインのディレクトリを${targetSide}ペインに同期しました`);
    } catch (error) {
      this.logError(error);
    }
  }

  async moveFile(item) {
    // ファイル移動処理
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
      

      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('移動元または移動先のディレクトリが選択されていません');
      }

      if (isDirectory) {
        const sourceDir = await sourceHandle.getDirectoryHandle(sourceName);
        await this.moveDirectory(sourceDir, targetHandle, sourceName);
        await sourceHandle.removeEntry(sourceName, { recursive: true });
      } else {
        const sourceFile = await sourceHandle.getFileHandle(sourceName);
        const targetFile = await targetHandle.getFileHandle(sourceName, { create: true });
        
        const file = await sourceFile.getFile();
        const writable = await targetFile.createWritable();
        await writable.write(file);
        await writable.close();
        
        await sourceHandle.removeEntry(sourceName);
      }

      await this.loadDirectoryContents(sourceSide);
      await this.loadDirectoryContents(targetSide);

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
    // フォルダ移動処理
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

  async copyFile(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';

      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      const sourceFile = await sourceHandle.getFileHandle(itemName);
      const targetFile = await targetHandle.getFileHandle(itemName, { create: true });

      const file = await sourceFile.getFile();
      const writable = await targetFile.createWritable();
      await writable.write(file);
      await writable.close();

      await this.loadDirectoryContents(targetSide);
      this.logMessage(`${itemName}を${sourceSide}から${targetSide}にコピーしました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  }

  async copyDirectory(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';

      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      const sourceDir = await sourceHandle.getDirectoryHandle(itemName);
      await this.copyDirectoryRecursive(sourceDir, targetHandle, itemName);

      await this.loadDirectoryContents(targetSide);
      this.logMessage(`${itemName}を${sourceSide}から${targetSide}にコピーしました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  }

  async copyDirectoryRecursive(sourceDir, targetParent, dirName) {
    const newDir = await targetParent.getDirectoryHandle(dirName, { create: true });

    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const newFile = await newDir.getFileHandle(entry.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        await this.copyDirectoryRecursive(entry, newDir, entry.name);
      }
    }
  }

  async deleteFileOrDirectory(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      if (itemName === '..') {
        this.logMessage('親ディレクトリは削除できません');
        this.exitCommandMode();
        return;
      }

      const pane = item.closest('.pane');
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const handle = this.currentHandles[side];

      if (!handle) {
        throw new Error('削除元のディレクトリが選択されていません');
      }

      // 確認ダイアログを表示
      const isDirectory = item.querySelector('.icon').textContent.includes('📁');
      const type = isDirectory ? 'フォルダ' : 'ファイル';
      if (!confirm(`${type}「${itemName}」を削除してもよろしいですか？`)) {
        this.exitCommandMode();
        return;
      }

      await handle.removeEntry(itemName, { recursive: true });
      await this.loadDirectoryContents(side);

      // フォーカスを維持
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
      }

      this.logMessage(`${itemName}を削除しました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  }

  // フォーカス位置を保存
  saveFocusPosition(side) {
    const pane = side === 'left' ? this.leftPane : this.rightPane;
    const items = Array.from(pane.querySelectorAll('.file-item'));
    const focusedItem = items.find(item => 
      item.classList.contains('focused') || item.classList.contains('command-focused')
    );
    
    if (focusedItem) {
      // フォーカスされているアイテムの名前を取得
      const focusedName = focusedItem.querySelector('.name').textContent;
      const currentPath = this.currentPaths[side];
      
      // 現在のディレクトリ内でのフォーカスされているアイテム名を保存
      this.focusHistory[side].set(currentPath, focusedName);
      console.log(`保存したフォーカス位置 - ${side}:`, currentPath, focusedName);
    }
  }

  // フォーカス位置を復元
  restoreFocusPosition(side) {
    const currentPath = this.currentPaths[side];
    const savedName = this.focusHistory[side].get(currentPath);
    
    const pane = side === 'left' ? this.leftPane : this.rightPane;
    const items = Array.from(pane.querySelectorAll('.file-item'));
    
    if (items.length > 0) {
      if (savedName) {
        // 保存されていたアイテム名と一致するアイテムを探す
        const targetItem = items.find(item => 
          item.querySelector('.name').textContent === savedName
        );
        
        if (targetItem) {
          // 一致するアイテムが見つかった場合、そのアイテムにフォーカス
          this.focusFileItem(targetItem);
          this.lastFocusedPane = pane.closest('.pane');
          this.lastFocusedIndexes[side] = items.indexOf(targetItem);
          console.log(`復元したフォーカス位置 - ${side}:`, currentPath, savedName);
        } else {
          // 一致するアイテムが見つからない場合は最初のアイテムにフォーカス
          this.focusFileItem(items[0]);
          this.lastFocusedPane = pane.closest('.pane');
          this.lastFocusedIndexes[side] = 0;
          console.log(`一致するアイテムが見つからないため、デフォルトフォーカス - ${side}:`, currentPath);
        }
      } else {
        // 保存された位置がない場合は最初のアイテムにフォーカス
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
        console.log(`デフォルトフォーカス位置 - ${side}:`, currentPath);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Main();
});

