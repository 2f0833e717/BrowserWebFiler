function initializeDirectoryUtils(mainInstance) {
  mainInstance.loadDirectoryContentsCommon = async function(side) {
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

    return pane;
  };

  mainInstance.loadDirectoryContents = async function(side) {
    try {
      const pane = await this.loadDirectoryContentsCommon(side);

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
  };

  mainInstance.loadDirectoryContentsWithoutFocus = async function(side) {
    try {
      await this.loadDirectoryContentsCommon(side);
    } catch (error) {
      this.logError(error);
    }
  };
}

// グローバルスコープに追加
window.initializeDirectoryUtils = initializeDirectoryUtils;
