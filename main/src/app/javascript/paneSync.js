function initializePaneSync(mainInstance) {
  mainInstance.syncDirectory = async function(fromSide) {
    try {
      const toSide = fromSide === 'left' ? 'right' : 'left';
      
      // 同期元のペインとフォーカス情報を保存
      const fromPane = fromSide === 'left' ? this.leftPane : this.rightPane;
      const focusedItem = fromPane.querySelector('.file-item.focused, .file-item.command-focused');
      const focusedIndex = focusedItem ? 
        Array.from(fromPane.querySelectorAll('.file-item')).indexOf(focusedItem) : 0;

      // ディレクトリの同期
      this.currentHandles[toSide] = this.currentHandles[fromSide];
      this.currentPaths[toSide] = this.currentPaths[fromSide];
      this.rootHandles[toSide] = this.rootHandles[fromSide];

      // 同期先のディレクトリ内容を更新
      await this.loadDirectoryContentsWithoutFocus(toSide);
      this.updatePathDisplay(toSide);

      // 同期元のペインのフォーカスを強制的に復元
      if (focusedItem) {
        // 他のすべてのフォーカスを解除
        document.querySelectorAll('.file-item').forEach(item => {
          item.classList.remove('focused', 'command-focused');
        });

        // 同期元のアイテムにフォーカスを設定
        if (this.commandMode) {
          focusedItem.classList.add('command-focused');
        } else {
          focusedItem.classList.add('focused');
        }

        // フォーカス関連の状態を更新
        this.lastFocusedPane = fromPane.closest('.pane');
        this.lastFocusedIndexes[fromSide] = focusedIndex;
      }

      // フォーカスを元のペインに戻す
      this.focusPane(fromSide);

      const message = `${fromSide}ペインのディレクトリを${toSide}ペインに同期しました`;
      this.logMessage(message);
    } catch (error) {
      this.logError(error);
    }
  };

  mainInstance.focusPane = function(pane) {
    // フォーカスを指定されたペインに移動する処理
    if (pane === 'left') {
      const items = Array.from(this.leftPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[this.lastFocusedIndexes.left]);
      }
    } else if (pane === 'right') {
      const items = Array.from(this.rightPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[this.lastFocusedIndexes.right]);
      }
    }
  };
}

// グローバルスコープに追加
window.initializePaneSync = initializePaneSync;
