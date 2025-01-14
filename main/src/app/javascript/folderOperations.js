function initializeFolderOperations(mainInstance) {
  mainInstance.showCreateFolderPopup = function() {
    // 既存のポップアップを削除
    const existingPopup = document.querySelector('.create-folder-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // ポップアップを作成
    const popup = document.createElement('div');
    popup.className = 'create-folder-popup';
    popup.innerHTML = `
      <div class="history-header">フォルダ作成</div>
      <div class="popup-content">
        <input type="text" class="folder-name-input" placeholder="フォルダ名を入力">
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
      const folderName = input.value.trim();
      if (folderName) {
        await mainInstance.createFolder(folderName);
        popup.remove();
        document.removeEventListener('keydown', handlePopupKeydown);
      }
    });

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const folderName = input.value.trim();
        if (folderName) {
          await mainInstance.createFolder(folderName);
          popup.remove();
          document.removeEventListener('keydown', handlePopupKeydown);
        }
      }
    });
  };

  mainInstance.createFolder = async function(folderName) {
    try {
      const pane = mainInstance.lastFocusedPane || document.querySelector('.left-pane');
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const currentHandle = mainInstance.currentHandles[side];
      if (!currentHandle) return;

      // フォルダを正しい場所に作成
      await currentHandle.getDirectoryHandle(folderName, { create: true });

      // ペインを更新
      await this.loadDirectoryContents('left');
      await this.loadDirectoryContents('right');

      // 新しいフォルダにフォーカスを設定
      const newFolderItem = document.querySelector(`.file-item[data-name='${folderName}']`);
      if (newFolderItem) {
        newFolderItem.focus();
      }
    } catch (error) {
      mainInstance.logError(`フォルダの作成に失敗しました: ${error.message}`);
    }
  };
}

// グローバルスコープに追加
window.initializeFolderOperations = initializeFolderOperations; 