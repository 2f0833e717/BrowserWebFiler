function initializePaneSwitch(mainInstance) {
  mainInstance.switchPane = function(targetSide) {
    // 現在のフォーカス位置を保存
    if (this.lastFocusedPane) {
      const currentSide = this.lastFocusedPane.classList.contains('left-pane') ? 'left' : 'right';
      const items = Array.from(this.lastFocusedPane.querySelectorAll('.file-item'));
      const currentIndex = items.findIndex(item => 
        item.classList.contains('focused') || item.classList.contains('command-focused')
      );
      if (currentIndex !== -1) {
        this.lastFocusedIndexes[currentSide] = currentIndex;
      }
    }

    // 対象のペインに切り替え
    const targetPane = document.querySelector(`.${targetSide}-pane .file-list`);
    const items = Array.from(targetPane.querySelectorAll('.file-item'));
    
    if (items.length > 0) {
      const targetIndex = Math.min(this.lastFocusedIndexes[targetSide], items.length - 1);
      
      // フォーカスを設定
      this.focusFileItem(items[targetIndex]);
      this.lastFocusedPane = targetPane.closest('.pane');
      this.lastFocusedIndexes[targetSide] = targetIndex;
    }
  };
}

// グローバルスコープに追加
window.initializePaneSwitch = initializePaneSwitch; 