function initializeDirectorySelection(mainInstance) {
  mainInstance.selectDirectory = async function(side) {
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
      
      // 選択したディレクトリを履歴に追加
      this.addToHistory(side, handle.name);
      
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      this.restoreFocusPosition(side);
      
      this.logMessage(`選択されたディレクトリ: ${handle.name}`);
    } catch (error) {
      this.logError(error);
    }
  };
}

// グローバルスコープに追加
window.initializeDirectorySelection = initializeDirectorySelection; 