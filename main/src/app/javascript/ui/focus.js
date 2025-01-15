function initializeFocus(mainInstance) {
  mainInstance.focusFileItem = function(item) {
    // 既存のフォーカスを解除
    const focusedItems = document.querySelectorAll('.file-item.focused, .file-item.command-focused');
    focusedItems.forEach(focusedItem => {
      focusedItem.classList.remove('focused', 'command-focused');
    });

    // 新しいアイテムにフォーカスを設定
    if (item) {
      if (this.commandMode) {
        item.classList.add('command-focused');
      } else {
        item.classList.add('focused');
      }
      this.lastFocusedPane = item.closest('.pane');
    }
  };

  mainInstance.handleArrowKeys = function(key) {
    const currentPane = this.lastFocusedPane;
    if (!currentPane) return;

    const items = Array.from(currentPane.querySelectorAll('.file-item'));
    const currentIndex = items.findIndex(item => 
      item.classList.contains('focused') || item.classList.contains('command-focused')
    );

    let newIndex;
    if (key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    } else if (key === 'ArrowDown') {
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : items.length - 1;
    }

    if (newIndex !== undefined && newIndex !== currentIndex) {
      const side = currentPane.classList.contains('left-pane') ? 'left' : 'right';
      this.lastFocusedIndexes[side] = newIndex;
      this.focusFileItem(items[newIndex]);
    }
  };

  mainInstance.handlePageKey = function(position) {
    const currentPane = this.lastFocusedPane;
    if (!currentPane) return;

    const items = Array.from(currentPane.querySelectorAll('.file-item'));
    if (items.length === 0) return;

    const side = currentPane.classList.contains('left-pane') ? 'left' : 'right';
    let newIndex;

    if (position === 'first') {
      newIndex = 0;
    } else if (position === 'last') {
      newIndex = items.length - 1;
    }

    if (newIndex !== undefined) {
      this.lastFocusedIndexes[side] = newIndex;
      this.focusFileItem(items[newIndex]);
    }
  };

  mainInstance.saveFocusPosition = function(side, path) {
    const pane = document.querySelector(`.${side}-pane .file-list`);
    const focusedItem = pane.querySelector('.file-item.focused, .file-item.command-focused');
    
    if (focusedItem) {
      const itemName = focusedItem.querySelector('.name').textContent;
      this.focusHistory[side].set(path, itemName);
      console.log(`保存したフォーカス位置 - ${side}: ${path}`);
    }
  };

  mainInstance.restoreFocusPosition = function(side, path) {
    const savedItemName = this.focusHistory[side].get(path);
    if (!savedItemName) return;

    const pane = document.querySelector(`.${side}-pane .file-list`);
    const items = Array.from(pane.querySelectorAll('.file-item'));
    
    const targetIndex = items.findIndex(item => 
      item.querySelector('.name').textContent === savedItemName
    );

    if (targetIndex !== -1) {
      this.lastFocusedIndexes[side] = targetIndex;
      this.focusFileItem(items[targetIndex]);
    }
  };
}

// グローバルスコープに追加
window.initializeFocus = initializeFocus; 