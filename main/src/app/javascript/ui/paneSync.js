function initializePaneSync(mainInstance) {
  mainInstance.syncPanes = async function() {
    const sourceSide = this.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
    const targetSide = sourceSide === 'left' ? 'right' : 'left';

    // 現在のパスを取得
    const currentPath = this.currentPaths[sourceSide];
    if (!currentPath) return;

    try {
      // 対象のディレクトリハンドルを取得
      const handle = await window.showDirectoryPicker({
        startIn: this.currentHandles[sourceSide]
      });

      // パスとハンドルを更新
      this.currentPaths[targetSide] = currentPath;
      this.currentHandles[targetSide] = handle;

      // ディレクトリ内容を更新
      await this.loadDirectoryContents(targetSide);
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.logError(error);
      }
    }
  };
}

// グローバルスコープに追加
window.initializePaneSync = initializePaneSync; 