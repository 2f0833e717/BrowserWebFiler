function initializeDirectoryUtils(mainInstance) {
  mainInstance.updatePathDisplay = function(side) {
    const pathElement = document.querySelector(`.path-${side} .current-path`);
    if (pathElement) {
      pathElement.textContent = this.currentPaths[side] || '';
    }
  };

  mainInstance.loadDirectoryContents = async function(side) {
    try {
      const handle = this.currentHandles[side];
      if (!handle) return;

      const pane = document.querySelector(`.${side}-pane .file-list`);
      pane.innerHTML = '';

      // 親ディレクトリへのリンクを追加
      const parentItem = document.createElement('div');
      parentItem.className = 'file-item';
      parentItem.innerHTML = `
        <span class="icon">📁</span>
        <span class="name">..</span>
      `;
      pane.appendChild(parentItem);

      // ファイルとフォルダの一覧を取得
      const entries = [];
      for await (const entry of handle.values()) {
        entries.push({
          name: entry.name,
          kind: entry.kind
        });
      }

      // 名前でソート
      entries.sort((a, b) => {
        if (a.kind === b.kind) {
          return a.name.localeCompare(b.name);
        }
        return a.kind === 'directory' ? -1 : 1;
      });

      // ファイルとフォルダを表示
      for (const entry of entries) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <span class="icon">${entry.kind === 'directory' ? '📁' : '📄'}</span>
          <span class="name">${entry.name}</span>
        `;
        pane.appendChild(item);
      }

      // フォーカスを設定
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        const targetIndex = Math.min(this.lastFocusedIndexes[side], items.length - 1);
        this.focusFileItem(items[targetIndex]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = targetIndex;

        // フォーカスが外れないように明示的にフォーカスを設定
        items[targetIndex].classList.add('focused');
        if (this.commandMode) {
          items[targetIndex].classList.add('command-focused');
        }
      }

      // パス表示を更新
      this.updatePathDisplay(side);
    } catch (error) {
      this.logError(error);
    }
  };

  mainInstance.loadDirectoryContentsWithoutFocus = async function(side) {
    try {
      const handle = this.currentHandles[side];
      if (!handle) return;

      const pane = document.querySelector(`.${side}-pane .file-list`);
      pane.innerHTML = '';

      // 親ディレクトリへのリンクを追加
      const parentItem = document.createElement('div');
      parentItem.className = 'file-item';
      parentItem.innerHTML = `
        <span class="icon">📁</span>
        <span class="name">..</span>
      `;
      pane.appendChild(parentItem);

      // ファイルとフォルダの一覧を取得
      const entries = [];
      for await (const entry of handle.values()) {
        entries.push({
          name: entry.name,
          kind: entry.kind
        });
      }

      // 名前でソート
      entries.sort((a, b) => {
        if (a.kind === b.kind) {
          return a.name.localeCompare(b.name);
        }
        return a.kind === 'directory' ? -1 : 1;
      });

      // ファイルとフォルダを表示
      for (const entry of entries) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <span class="icon">${entry.kind === 'directory' ? '📁' : '📄'}</span>
          <span class="name">${entry.name}</span>
        `;
        pane.appendChild(item);
      }

      // パス表示を更新
      this.updatePathDisplay(side);
    } catch (error) {
      this.logError(error);
    }
  };
}

// グローバルスコープに追加
window.initializeDirectoryUtils = initializeDirectoryUtils; 