function initializePaneSync(mainInstance) {
  mainInstance.syncPanes = async function() {
    if (!this.lastFocusedPane) return;

    const sourceSide = this.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
    const targetSide = sourceSide === 'left' ? 'right' : 'left';

    // 現在のパスを取得
    const currentPath = this.currentPaths[sourceSide];
    const sourceHandle = this.currentHandles[sourceSide];
    if (!currentPath || !sourceHandle) return;

    try {
      // 対象のディレクトリハンドルを取得（現在のディレクトリと同じものを使用）
      this.currentPaths[targetSide] = currentPath;
      this.currentHandles[targetSide] = sourceHandle;
      this.rootHandles[targetSide] = this.rootHandles[sourceSide];

      // ディレクトリ内容を更新
      await this.loadDirectoryContentsWithoutFocus(targetSide);
      
      // フォーカスを設定
      const pane = document.querySelector(`.${targetSide}-pane`);
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        // フォーカスを一番上のアイテムに設定
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane;
        this.lastFocusedIndexes[targetSide] = 0;
        
        // フォーカスが外れないように明示的にフォーカスを設定
        items[0].classList.add('focused');
        if (this.commandMode) {
          items[0].classList.add('command-focused');
        }
      }

      this.logMessage(`同期したディレクトリ: ${currentPath}`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.logError(error);
      }
    }
  };
}

// グローバルスコープに追加
window.initializePaneSync = initializePaneSync; 