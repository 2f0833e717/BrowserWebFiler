function initializeEventListeners(mainInstance) {
  // ディレクトリ選択ボタン
  document.querySelectorAll('.btn.select-dir').forEach(btn => {
    // mousedownイベントでフォーカスを防ぐ
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const pane = e.target.closest('.pane');
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      btn.blur(); // フォーカスを外す
      await mainInstance.selectDirectory(side);
    });
  });

  // ファイルリストのクリックイベント
  document.querySelectorAll('.file-list').forEach(list => {
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.file-item');
      if (item) {
        mainInstance.focusFileItem(item);
      }
    });
  });

  // ダブルクリックイベント
  document.querySelectorAll('.file-list').forEach(list => {
    list.addEventListener('dblclick', async (e) => {
      const item = e.target.closest('.file-item');
      if (item) {
        const pane = e.target.closest('.pane');
        const side = pane.classList.contains('left-pane') ? 'left' : 'right';
        const itemName = item.querySelector('.name').textContent;
        if (itemName === '..') {
          await mainInstance.changeParentDirectory(side);
        } else {
          await mainInstance.changeDirectory(side, itemName);
        }
      }
    });
  });

  // ペインのクリックでフォーカスを設定
  document.querySelectorAll('.pane').forEach(pane => {
    pane.addEventListener('click', () => {
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      mainInstance.switchPane(side);
    });
  });
}

// グローバルスコープに追加
window.initializeEventListeners = initializeEventListeners;
