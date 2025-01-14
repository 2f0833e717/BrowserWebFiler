function initializeCreateFileOperations(mainInstance) {
  mainInstance.showCreateFilePopup = function() {
    // 既存のポップアップを削除
    const existingPopup = document.querySelector('.create-folder-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // ポップアップを作成
    const popup = document.createElement('div');
    popup.className = 'create-folder-popup';
    popup.innerHTML = `
      <div class="history-header">ファイル作成</div>
      <div class="popup-content">
        <input type="text" class="folder-name-input" placeholder="ファイル名を入力">
        <button class="create-folder-btn">作成</button>
      </div>
    `;

    document.body.appendChild(popup);

    const input = popup.querySelector('.folder-name-input');
    const button = popup.querySelector('.create-folder-btn');

    input.focus();

    // キーイベントハンドラ
    const handlePopupKeydown = (e) => {
      if (e.key === 'Escape') {
        popup.remove();
        document.removeEventListener('keydown', handlePopupKeydown);
      }
    };

    document.addEventListener('keydown', handlePopupKeydown);

    button.addEventListener('click', async () => {
      const fileName = input.value.trim();
      if (fileName) {
        await mainInstance.createFile(fileName);
        popup.remove();
        document.removeEventListener('keydown', handlePopupKeydown);
      }
    });

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const fileName = input.value.trim();
        if (fileName) {
          await mainInstance.createFile(fileName);
          popup.remove();
          document.removeEventListener('keydown', handlePopupKeydown);
        }
      }
    });
  };

  mainInstance.createFile = async function(fileName) {
    try {
      const pane = mainInstance.lastFocusedPane || document.querySelector('.left-pane');
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const currentHandle = mainInstance.currentHandles[side];
      if (!currentHandle) return;

      // ファイルを正しい場所に作成
      await currentHandle.getFileHandle(fileName, { create: true });

      // フォーカスを設定せずにペインを更新
      await this.loadDirectoryContentsWithoutFocus(side);
      const oppositeSide = side === 'left' ? 'right' : 'left';
      await this.loadDirectoryContentsWithoutFocus(oppositeSide);

      // 新しいファイルにフォーカスを設定
      const fileList = pane.querySelector('.file-list');
      const items = Array.from(fileList.querySelectorAll('.file-item'));
      const newFileItem = items.find(item => 
        item.querySelector('.name').textContent === fileName
      );

      if (newFileItem) {
        this.focusFileItem(newFileItem);
        this.lastFocusedPane = pane;
        this.lastFocusedIndexes[side] = items.indexOf(newFileItem);
      }

      this.logMessage(`ファイル「${fileName}」を作成しました`);
    } catch (error) {
      this.logError(`ファイルの作成に失敗しました: ${error.message}`);
    }
  };
}

// グローバルスコープに追加
window.initializeCreateFileOperations = initializeCreateFileOperations; 