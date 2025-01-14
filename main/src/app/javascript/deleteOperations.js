function initializeDeleteOperations(mainInstance) {
  mainInstance.deleteFileOrDirectory = async function(item) {
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

      const isDirectory = item.querySelector('.icon').textContent.includes('📁');
      const type = isDirectory ? 'フォルダ' : 'ファイル';
      if (!confirm(`${type}「${itemName}」を削除してもよろしいですか？`)) {
        this.exitCommandMode();
        return;
      }

      await handle.removeEntry(itemName, { recursive: true });
      await this.loadDirectoryContents(side);

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
  };
}

window.initializeDeleteOperations = initializeDeleteOperations;
