function initializeKeyHandlers(mainInstance) {
  mainInstance.handleArrowKeys = function(key) {
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
  };

  mainInstance.handlePageKey = function(position) {
    const pane = this.lastFocusedPane || document.querySelector('.left-pane');
    const items = Array.from(pane.querySelectorAll('.file-item'));
    if (items.length === 0) return;

    const newIndex = position === 'first' ? 0 : items.length - 1;
    const side = pane.classList.contains('left-pane') ? 'left' : 'right';
    
    this.lastFocusedIndexes[side] = newIndex;
    this.focusFileItem(items[newIndex]);
  };

  mainInstance.changeDirectory = async function(side, itemName) {
    try {
      this.saveFocusPosition(side);

      const handle = this.currentHandles[side];
      if (!handle) return;

      const newHandle = await handle.getDirectoryHandle(itemName);
      this.currentHandles[side] = newHandle;
      
      const path = `${this.currentPaths[side]}\\${itemName}`;
      this.currentPaths[side] = path;
      
      // 履歴に追加
      this.addToHistory(side, path);
      
      // フォーカスを設定せずにディレクトリ内容を読み込む
      await this.loadDirectoryContentsWithoutFocus(side);
      this.updatePathDisplay(side);
      
      // フォーカスを設定
      const pane = side === 'left' ? this.leftPane : this.rightPane;
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.restoreFocusPosition(side);
        this.lastFocusedPane = pane.closest('.pane');
      }
      
      this.logMessage(`移動したディレクトリ: ${path}`);
    } catch (error) {
      this.logError(error);
    }
  };

  mainInstance.changeParentDirectory = async function(side) {
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
        // ルートディレクトリも履歴に追加
        this.addToHistory(side, this.rootHandles[side].name);
      } else {
        let newHandle = this.rootHandles[side];
        
        // 目的のディレクトリまで順番に移動
        for (const part of parentPathParts) {
          if (part === this.rootHandles[side].name) continue;
          try {
            newHandle = await newHandle.getDirectoryHandle(part);
          } catch (error) {
            this.logError(new Error(`ディレクトリの取得に失敗: ${part}`));
            return;
          }
        }

        this.currentHandles[side] = newHandle;
        this.currentPaths[side] = parentPath || this.rootHandles[side].name;
        // 親ディレクトリを履歴に追加
        this.addToHistory(side, this.currentPaths[side]);
      }

      // フォーカスを設定せずにディレクトリ内容を読み込む
      await this.loadDirectoryContentsWithoutFocus(side);
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
      } else {
        // 移動元ディレクトリが見つからない場合は保存されていた位置を復元
        this.restoreFocusPosition(side);
        this.lastFocusedPane = pane.closest('.pane');
      }

      this.logMessage(`移動したディレクトリ: ${this.currentPaths[side]}`);
    } catch (error) {
      this.logError(error);
    }
  };
}

// グローバルスコープに追加
window.initializeKeyHandlers = initializeKeyHandlers;
