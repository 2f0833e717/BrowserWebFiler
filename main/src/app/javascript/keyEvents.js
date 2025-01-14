function initializeKeyEvents(mainInstance) {
  document.addEventListener('keydown', async (e) => {
    const focusedItem = document.querySelector('.file-item.focused, .file-item.command-focused');
    // ポップアップが表示されているかチェック
    const historyPopup = document.querySelector('.history-popup');
    if (historyPopup) {
      // ポップアップ表示中は通常のキーイベントを無効化
      e.preventDefault();
      return; 
    }
    
    if (!focusedItem) return;

    switch (e.key) {
      case ' ':
        mainInstance.toggleCommandMode(focusedItem);
        e.preventDefault();
        break;

      case 'm':
        if (mainInstance.commandMode) {
          await mainInstance.moveFile(focusedItem);
        } else {
          mainInstance.enableCommandMode(focusedItem);
        }
        e.preventDefault();
        break;

      case 'c':
        if (mainInstance.commandMode) {
          const itemName = focusedItem.querySelector('.name').textContent;
          const isDirectory = focusedItem.querySelector('.icon').textContent.includes('📁');
          if (isDirectory) {
            await mainInstance.copyDirectory(focusedItem);
          } else {
            await mainInstance.copyFile(focusedItem);
          }
        } else {
          mainInstance.enableCommandMode(focusedItem);
        }
        e.preventDefault();
        break;

      case 'd':
        if (mainInstance.commandMode) {
          await mainInstance.deleteFileOrDirectory(focusedItem);
        } else {
          mainInstance.enableCommandMode(focusedItem);
        }
        e.preventDefault();
        break;

      case 'Enter':
        if (focusedItem && !mainInstance.commandMode) {
          const pane = focusedItem.closest('.pane');
          const side = pane.classList.contains('left-pane') ? 'left' : 'right';
          const itemName = focusedItem.querySelector('.name').textContent;
          if (itemName === '..') {
            await mainInstance.changeParentDirectory(side);
          } else {
            await mainInstance.changeDirectory(side, itemName);
          }
        }
        break;

      case 'Escape':
        if (mainInstance.commandMode) {
          mainInstance.exitCommandMode();
        }
        break;

      case 'ArrowLeft':
        if (!mainInstance.commandMode) {
          if (mainInstance.lastFocusedPane && mainInstance.lastFocusedPane.classList.contains('right-pane')) {
            mainInstance.switchPane('left');
          } else {
            await mainInstance.changeParentDirectory('left');
          }
        }
        break;

      case 'ArrowRight':
        if (!mainInstance.commandMode) {
          if (mainInstance.lastFocusedPane && mainInstance.lastFocusedPane.classList.contains('left-pane')) {
            mainInstance.switchPane('right');
          } else if (mainInstance.lastFocusedPane && mainInstance.lastFocusedPane.classList.contains('right-pane')) {
            await mainInstance.changeParentDirectory('right');
          }
        }
        break;

      case 'ArrowUp':
      case 'ArrowDown':
        if (!mainInstance.commandMode) {
          mainInstance.handleArrowKeys(e.key);
        }
        break;

      case 'PageUp':
        if (!mainInstance.commandMode) {
          mainInstance.handlePageKey('first');
        }
        break;

      case 'PageDown':
        if (!mainInstance.commandMode) {
          mainInstance.handlePageKey('last');
        }
        break;

      case 'O':
        if (e.shiftKey) {
          const pane = focusedItem.closest('.pane');
          const side = pane.classList.contains('left-pane') ? 'left' : 'right';
          await mainInstance.syncDirectory(side);
          e.preventDefault();
        }
        break;

      case 'h':
        if (!mainInstance.commandMode && mainInstance.lastFocusedPane) {
          e.preventDefault();
          const historyPopup = document.querySelector('.history-popup');
          if (historyPopup) {
            // 履歴ポップアップが表示されている場合は閉じる
            historyPopup.remove();
            // キーイベントハンドラも削除
            document.removeEventListener('keydown', mainInstance.handleHistoryKeydown);
          } else {
            // 履歴ポップアップを表示
            const side = mainInstance.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
            mainInstance.showHistoryPopup(side);
          }
        }
        break;
    }
  });
}

// グローバルスコープに追加
window.initializeKeyEvents = initializeKeyEvents;
