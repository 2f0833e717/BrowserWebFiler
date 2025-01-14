function initializeFileOperations(mainInstance) {
  mainInstance.getSourceAndTargetHandles = function(item) {
    const sourcePane = item.closest('.pane');
    const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
    const targetSide = sourceSide === 'left' ? 'right' : 'left';

    return {
      sourceSide,
      targetSide,
      sourceHandle: this.currentHandles[sourceSide],
      targetHandle: this.currentHandles[targetSide]
    };
  };

  mainInstance.updateUIAfterOperation = async function(sourceSide, targetSide, itemName, operation) {
    try {
      // ファイルシステムの状態を安定させる
      await new Promise(resolve => setTimeout(resolve, 500));

      // 両方のペインのハンドルを更新
      const sourceHandle = await this.refreshDirectoryHandle(sourceSide);
      const targetHandle = await this.refreshDirectoryHandle(targetSide);
      
      if (sourceHandle && targetHandle) {
        // ハンドルを更新
        this.currentHandles[sourceSide] = sourceHandle;
        this.currentHandles[targetSide] = targetHandle;

        // UIを更新
        await Promise.all([
          this.loadDirectoryContentsWithoutFocus(sourceSide),
          this.loadDirectoryContentsWithoutFocus(targetSide)
        ]);

        // 状態を安定させる
        await new Promise(resolve => setTimeout(resolve, 200));

        // 移動先のアイテムにフォーカスを設定
        const targetPane = document.querySelector(`.${targetSide}-pane .file-list`);
        const items = Array.from(targetPane.querySelectorAll('.file-item'));
        
        if (items.length > 0) {
          const movedItem = items.find(item => 
            item.querySelector('.name').textContent === itemName
          );

          if (movedItem) {
            this.focusFileItem(movedItem);
            this.lastFocusedPane = targetPane.closest('.pane');
            this.lastFocusedIndexes[targetSide] = items.indexOf(movedItem);
          } else {
            this.focusFileItem(items[0]);
            this.lastFocusedPane = targetPane.closest('.pane');
            this.lastFocusedIndexes[targetSide] = 0;
          }
        }
      }

      this.logMessage(`${itemName}を${sourceSide}から${targetSide}に${operation}しました`);
    } catch (error) {
      this.logError(`UI更新中にエラー: ${error.message}`);
    } finally {
      this.exitCommandMode();
    }
  };

  mainInstance.refreshDirectoryHandle = async function(side) {
    try {
      const currentPath = this.currentPaths[side];
      const pathParts = currentPath.split('\\').filter(part => part);
      let handle = this.rootHandles[side];

      for (const part of pathParts) {
        if (part === this.rootHandles[side].name) continue;
        handle = await handle.getDirectoryHandle(part);
      }

      return handle;
    } catch (error) {
      this.logError(new Error(`ディレクトリハンドルの更新に失敗: ${error.message}`));
      return null;
    }
  };

  mainInstance.checkFileExists = async function(parent, name) {
    try {
      await parent.getFileHandle(name);
      return true;
    } catch {
      return false;
    }
  };

  mainInstance.focusPane = function(pane) {
    // フォーカスを指定されたペインに移動する処理
    if (pane === 'left') {
      const items = Array.from(this.leftPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[this.lastFocusedIndexes.left]);
      }
    } else if (pane === 'right') {
      const items = Array.from(this.rightPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[this.lastFocusedIndexes.right]);
      }
    }
  };
}

window.initializeFileOperations = initializeFileOperations;
