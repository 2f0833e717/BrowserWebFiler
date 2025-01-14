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

      const items = Array.from(pane.querySelectorAll('.file-item'));
      const currentIndex = items.indexOf(item);
      const nextIndex = Math.min(currentIndex, items.length - 2);

      await handle.removeEntry(itemName, { recursive: true });

      await this.loadDirectoryContentsWithoutFocus(side);
      const oppositeSide = side === 'left' ? 'right' : 'left';
      await this.loadDirectoryContentsWithoutFocus(oppositeSide);

      const updatedItems = Array.from(pane.querySelectorAll('.file-item'));
      if (updatedItems.length > 0) {
        const targetIndex = Math.min(nextIndex, updatedItems.length - 1);
        this.focusFileItem(updatedItems[targetIndex]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = targetIndex;
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
