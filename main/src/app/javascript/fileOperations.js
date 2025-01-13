function initializeFileOperations(mainInstance) {
  mainInstance.moveFile = async function(item) {
    if (!item) return;

    try {
      const sourceName = item.querySelector('.name').textContent;
      if (sourceName === '..') {
        this.logMessage('親ディレクトリは移動できません');
        this.exitCommandMode();
        return;
      }

      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';
      
      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('移動元または移動先のディレクトリが選択されていません');
      }

      if (isDirectory) {
        const sourceDir = await sourceHandle.getDirectoryHandle(sourceName);
        await this.moveDirectory(sourceDir, targetHandle, sourceName);
        await sourceHandle.removeEntry(sourceName, { recursive: true });
      } else {
        const sourceFile = await sourceHandle.getFileHandle(sourceName);
        const targetFile = await targetHandle.getFileHandle(sourceName, { create: true });
        
        const file = await sourceFile.getFile();
        const writable = await targetFile.createWritable();
        await writable.write(file);
        await writable.close();
        
        await sourceHandle.removeEntry(sourceName);
      }

      await this.loadDirectoryContents(sourceSide);
      await this.loadDirectoryContents(targetSide);

      const targetPane = document.querySelector(`.${targetSide}-pane`);
      const items = Array.from(targetPane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        this.lastFocusedPane = targetPane;
      }

      this.logMessage(`${sourceName}を${sourceSide}から${targetSide}に移動しました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };

  mainInstance.moveDirectory = async function(sourceDir, targetParent, dirName) {
    const newDir = await targetParent.getDirectoryHandle(dirName, { create: true });
    
    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const newFile = await newDir.getFileHandle(entry.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        await this.moveDirectory(entry, newDir, entry.name);
      }
    }
  };

  mainInstance.copyFile = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';

      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      const sourceFile = await sourceHandle.getFileHandle(itemName);
      const targetFile = await targetHandle.getFileHandle(itemName, { create: true });

      const file = await sourceFile.getFile();
      const writable = await targetFile.createWritable();
      await writable.write(file);
      await writable.close();

      await this.loadDirectoryContents(targetSide);
      this.logMessage(`${itemName}を${sourceSide}から${targetSide}にコピーしました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };

  mainInstance.copyDirectory = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const sourcePane = item.closest('.pane');
      const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
      const targetSide = sourceSide === 'left' ? 'right' : 'left';

      const sourceHandle = this.currentHandles[sourceSide];
      const targetHandle = this.currentHandles[targetSide];

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      const sourceDir = await sourceHandle.getDirectoryHandle(itemName);
      await this.copyDirectoryRecursive(sourceDir, targetHandle, itemName);

      await this.loadDirectoryContents(targetSide);
      this.logMessage(`${itemName}を${sourceSide}から${targetSide}にコピーしました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };

  mainInstance.copyDirectoryRecursive = async function(sourceDir, targetParent, dirName) {
    const newDir = await targetParent.getDirectoryHandle(dirName, { create: true });

    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const newFile = await newDir.getFileHandle(entry.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        await this.copyDirectoryRecursive(entry, newDir, entry.name);
      }
    }
  };

  mainInstance.deleteFileOrDirectory = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      if (itemName === '..') {
        this.logMessage('親ディレクトリは削除できません');
        this.exitCommandMode();
        return;
      }

      const pane = item.closest('.pane');
      const side = pane.classList.contains('left-pane') ? 'left' : 'right';
      const handle = this.currentHandles[side];

      if (!handle) {
        throw new Error('削除元のディレクトリが選択されていません');
      }

      // 確認ダイアログを表示
      const isDirectory = item.querySelector('.icon').textContent.includes('📁');
      const type = isDirectory ? 'フォルダ' : 'ファイル';
      if (!confirm(`${type}「${itemName}」を削除してもよろしいですか？`)) {
        this.exitCommandMode();
        return;
      }

      await handle.removeEntry(itemName, { recursive: true });
      await this.loadDirectoryContents(side);

      // フォーカスを維持
      const items = Array.from(pane.querySelectorAll('.file-item'));
      if (items.length > 0) {
        this.focusFileItem(items[0]);
        this.lastFocusedPane = pane.closest('.pane');
        this.lastFocusedIndexes[side] = 0;
      }

      this.logMessage(`${itemName}を削除しました`);
      this.exitCommandMode();
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };
}

// グローバルスコープに追加
window.initializeFileOperations = initializeFileOperations;
