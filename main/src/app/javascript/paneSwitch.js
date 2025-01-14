function initializePaneSwitch(mainInstance) {
  mainInstance.switchPane = function(targetSide) {
    // 現在のフォーカス位置を保存
    if (this.lastFocusedPane) {
      const currentSide = this.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
      const items = Array.from(this.lastFocusedPane.querySelectorAll('.file-item'));
      const currentIndex = items.findIndex(item => item.classList.contains('focused'));
      if (currentIndex !== -1) {
        this.lastFocusedIndexes[currentSide] = currentIndex;
      }
    }

    // 対象のペインに切り替え
    const targetPane = document.querySelector(`.${targetSide}-pane .file-list`);
    this.lastFocusedPane = targetPane;

    // 保存していたフォーカス位置を復元
    const items = Array.from(targetPane.querySelectorAll('.file-item'));
    if (items.length > 0) {
      const targetIndex = Math.min(this.lastFocusedIndexes[targetSide], items.length - 1);
      this.focusFileItem(items[targetIndex]);

      // フォーカス表示を更新
      document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('focused');
      });
      if (items[targetIndex]) {
        items[targetIndex].classList.add('focused');
      }
    }
  };
}

// グローバルスコープに追加
window.initializePaneSwitch = initializePaneSwitch;
