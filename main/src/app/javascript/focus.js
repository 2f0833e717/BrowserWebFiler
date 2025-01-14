function initializeFocus(mainInstance) {
  mainInstance.focusFileItem = function(item) {
    if (!item) return;

    // 既存のフォーカスを解除
    document.querySelectorAll('.file-item.focused, .file-item.command-focused').forEach(el => {
      el.classList.remove('focused', 'command-focused');
    });

    // 新しいフォーカスを設定
    if (this.commandMode) {
      item.classList.add('command-focused');
    } else {
      item.classList.add('focused');
    }

    // ペインのフォーカス状態を更新
    const pane = item.closest('.pane');
    if (pane) {
      this.lastFocusedPane = pane;
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const items = Array.from(pane.querySelectorAll('.file-item'));
      const currentIndex = items.indexOf(item);
      this.lastFocusedIndexes[side] = currentIndex;

      // ビューポートの状態を確認
      const fileList = item.closest('.file-list');
      const itemRect = item.getBoundingClientRect();
      const viewportRect = fileList.getBoundingClientRect();
      const itemFullyVisible = 
        itemRect.top >= viewportRect.top && 
        itemRect.bottom <= viewportRect.bottom;

      // アイテムが完全に表示されていない場合のみスクロール
      if (!itemFullyVisible) {
        let newScrollTop;
        
        if (itemRect.bottom > viewportRect.bottom) {
          // 下部が見切れている場合
          newScrollTop = fileList.scrollTop + (itemRect.bottom - viewportRect.bottom);
        } else if (itemRect.top < viewportRect.top) {
          // 上部が見切れている場合
          newScrollTop = fileList.scrollTop + (itemRect.top - viewportRect.top);
        }

        // スクロールが必要な場合のみ実行
        if (newScrollTop !== undefined) {
          fileList.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  mainInstance.saveFocusPosition = function(side) {
    const pane = side === 'left' ? this.leftPane : this.rightPane;
    const items = Array.from(pane.querySelectorAll('.file-item'));
    const focusedItem = items.find(item => 
      item.classList.contains('focused') || item.classList.contains('command-focused')
    );
    
    if (focusedItem) {
      // フォーカスされているアイテムの名前を取得
      const focusedName = focusedItem.querySelector('.name').textContent;
      const currentPath = this.currentPaths[side];
      
      // 現在のディレクトリ内でのフォーカスされているアイテム名を保存
      this.focusHistory[side].set(currentPath, focusedName);
      console.log(`保存したフォーカス位置 - ${side}:`, currentPath, focusedName);
    }
  };

  mainInstance.restoreFocusPosition = function(side) {
    const currentPath = this.currentPaths[side];
    const savedName = this.focusHistory[side].get(currentPath);
    
    const pane = side === 'left' ? this.leftPane : this.rightPane;
    const items = Array.from(pane.querySelectorAll('.file-item'));
    
    if (items.length > 0) {
      if (savedName) {
        // 保存されていたアイテム名と一致するアイテムを探す
        const targetItem = items.find(item => 
          item.querySelector('.name').textContent === savedName
        );
        
        if (targetItem) {
          // 一致するアイテムが見つかった場合、そのアイテムにフォーカス
          this.focusFileItem(targetItem);
          this.lastFocusedPane = pane.closest('.pane');
          this.lastFocusedIndexes[side] = items.indexOf(targetItem);
          console.log(`復元したフォーカス位置 - ${side}:`, currentPath, savedName);
        } else {
          // 一致するアイテムが見つからない場合は最初のアイテムにフォーカス
          this.focusFileItem(items[0]);
          this.lastFocusedPane = pane.closest('.pane');
          this.lastFocusedIndexes[side] = 0;
          console.log(`一致するアイテムが見つからないため、デフォルトフォーカス - ${side}:`, currentPath);
        }
      } else {
        // 保存された位置がない場合は最初のアイテムにフォーカス
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
        console.log(`デフォルトフォーカス位置 - ${side}:`, currentPath);
      }
    }
  };
}

// グローバルスコープに追加
window.initializeFocus = initializeFocus;
