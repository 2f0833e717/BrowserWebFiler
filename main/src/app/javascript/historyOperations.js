function initializeHistoryOperations(mainInstance) {
  mainInstance.directoryHistory = {
    left: [],
    right: []
  };
  
  mainInstance.addToHistory = function(side, path) {
    const history = this.directoryHistory[side];
    // 同じパスが既に履歴にある場合は除去
    const index = history.indexOf(path);
    if (index !== -1) {
      history.splice(index, 1);
    }
    // 先頭に追加
    history.unshift(path);
    // 最大15件に制限
    if (history.length > 15) {
      history.pop();
    }
  };

  mainInstance.showHistoryPopup = function(side) {
    const history = this.directoryHistory[side];
    if (history.length === 0) {
      this.logMessage('履歴がありません');
      return;
    }

    // 既存のポップアップを削除
    const existingPopup = document.querySelector('.history-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // ポップアップを作成
    const popup = document.createElement('div');
    popup.className = 'history-popup';
    popup.innerHTML = `
      <div class="history-header">ディレクトリ履歴 (${side})</div>
      <div class="history-list">
        ${history.map((path, index) => `
          <div class="history-item" data-index="${index}">
            ${path}
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(popup);
    
    // 最初の項目を選択
    const firstItem = popup.querySelector('.history-item');
    if (firstItem) {
      firstItem.classList.add('selected');
    }

    // キーイベントハンドラ
    const handleHistoryKeydown = async (e) => {
      e.stopPropagation(); // イベントの伝播を停止
      e.preventDefault(); // デフォルトの動作を防止
      
      const selected = popup.querySelector('.history-item.selected');
      const items = Array.from(popup.querySelectorAll('.history-item'));
      const currentIndex = selected ? parseInt(selected.dataset.index) : 0;

      switch (e.key) {
        case 'ArrowUp':
          if (currentIndex > 0) {
            selected.classList.remove('selected');
            items[currentIndex - 1].classList.add('selected');
            items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
          }
          break;

        case 'ArrowDown':
          if (currentIndex < items.length - 1) {
            selected.classList.remove('selected');
            items[currentIndex + 1].classList.add('selected');
            items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
          }
          break;

        case 'PageUp':
          selected.classList.remove('selected');
          items[0].classList.add('selected');
          items[0].scrollIntoView({ block: 'start' });
          break;

        case 'PageDown':
          selected.classList.remove('selected');
          items[items.length - 1].classList.add('selected');
          items[items.length - 1].scrollIntoView({ block: 'end' });
          break;

        case 'Enter':
          const selectedPath = history[currentIndex];
          popup.remove();
          document.removeEventListener('keydown', handleHistoryKeydown);
          await this.jumpToDirectory(side, selectedPath);
          break;

        case 'Escape':
          popup.remove();
          document.removeEventListener('keydown', handleHistoryKeydown);
          break;
      }
    };

    // キーイベントハンドラを登録
    document.addEventListener('keydown', handleHistoryKeydown);

    // ポップアップがクリックされたときのハンドラ
    popup.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (!item) return;

      const items = Array.from(popup.querySelectorAll('.history-item'));
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  };

  mainInstance.jumpToDirectory = async function(side, path) {
    try {
      // パスをクリーンアップ
      path = path.replace(/^\\+|\\+$/g, '');
      const parts = path.split('\\').filter(part => part);

      // ルートディレクトリのチェック
      if (!this.rootHandles[side]) {
        throw new Error('ルートディレクトリが選択されていません');
      }

      let currentHandle = this.rootHandles[side];
      
      // ルートディレクトリ名をスキップ
      const rootName = this.rootHandles[side].name;
      const targetParts = parts.filter(part => part !== rootName);

      // 目的のディレクトリまで順番に移動
      for (const part of targetParts) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part);
        } catch (error) {
          throw new Error(`ディレクトリ "${part}" が見つかりません`);
        }
      }

      // 現在のハンドルとパスを更新
      this.currentHandles[side] = currentHandle;
      this.currentPaths[side] = path;
      
      await this.loadDirectoryContents(side);
      this.updatePathDisplay(side);
      
      // 履歴に追加（重複を避けるため）
      this.addToHistory(side, path);

      // フォーカスを設定
      const pane = side === 'left' ? this.leftPane : this.rightPane;
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        // 最初のアイテムにフォーカスを設定
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
      }
      
      this.logMessage(`${side}ペイン: ${path} に移動しました`);
    } catch (error) {
      this.logError(`ディレクトリへの移動に失敗しました: ${error.message}`);
    }
  };
}

window.initializeHistoryOperations = initializeHistoryOperations;
