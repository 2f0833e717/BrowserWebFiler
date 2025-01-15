function initializePaneSwitch(mainInstance) {
  mainInstance.switchPane = function() {
    const leftPane = document.querySelector('.left-pane');
    const rightPane = document.querySelector('.right-pane');
    
    if (this.lastFocusedPane === leftPane) {
      const rightItems = Array.from(rightPane.querySelectorAll('.file-item'));
      if (rightItems.length > 0) {
        const targetIndex = Math.min(this.lastFocusedIndexes.right, rightItems.length - 1);
        this.focusFileItem(rightItems[targetIndex]);
      }
    } else {
      const leftItems = Array.from(leftPane.querySelectorAll('.file-item'));
      if (leftItems.length > 0) {
        const targetIndex = Math.min(this.lastFocusedIndexes.left, leftItems.length - 1);
        this.focusFileItem(leftItems[targetIndex]);
      }
    }
  };
}

// グローバルスコープに追加
window.initializePaneSwitch = initializePaneSwitch; 