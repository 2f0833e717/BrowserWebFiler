function initializeMoveOperations(mainInstance) {
  mainInstance.moveFile = async function(item) {
    if (!item) return;

    try {
      const sourceName = item.querySelector('.name').textContent;
      if (sourceName === '..') {
        this.logMessage('親ディレクトリは移動できません');
        this.exitCommandMode();
        return;
      }

      const { sourceSide, targetSide, sourceHandle, targetHandle } = this.getSourceAndTargetHandles(item);
      if (!sourceHandle || !targetHandle) {
        throw new Error('移動元または移動先のディレクトリが見つかりません');
      }

      const refreshedSourceHandle = await this.refreshDirectoryHandle(sourceSide);
      const refreshedTargetHandle = await this.refreshDirectoryHandle(targetSide);
      if (!refreshedSourceHandle || !refreshedTargetHandle) {
        throw new Error('ディレクトリハンドルの更新に失敗しました');
      }

      const isDirectory = item.querySelector('.icon').textContent.includes('📁');
      if (isDirectory) {
        const sourceDir = await refreshedSourceHandle.getDirectoryHandle(sourceName);
        const result = await this.moveDirectory(sourceDir, refreshedTargetHandle, sourceName);
        if (result) {
          await refreshedSourceHandle.removeEntry(sourceName, { recursive: true });
        }
      } else {
        const targetExists = await this.checkFileExists(refreshedTargetHandle, sourceName);
        if (targetExists) {
          if (!confirm(`移動先に「${sourceName}」が既に存在します。上書きしますか？`)) {
            this.exitCommandMode();
            return;
          }
          await refreshedTargetHandle.removeEntry(sourceName);
        }
        await this.moveFileHandle(refreshedSourceHandle, refreshedTargetHandle, sourceName);
      }

      this.currentHandles[sourceSide] = refreshedSourceHandle;
      this.currentHandles[targetSide] = refreshedTargetHandle;

      await this.updateUIAfterOperation(sourceSide, targetSide, sourceName, '移動');
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };

  mainInstance.moveDirectory = async function(sourceDir, targetParent, dirName) {
    try {
      const targetExists = await this.checkDirectoryExists(targetParent, dirName);
      if (targetExists) {
        if (!confirm(`移動先に「${dirName}」が既に存在します。上書きしますか？`)) {
          throw new Error('ユーザーによってキャンセルされました');
        }
        try {
          await targetParent.removeEntry(dirName, { recursive: true });
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) {
          console.warn('既存ディレクトリの削除をスキップ:', e);
        }
      }

      const entries = [];
      const sourceSnapshot = new Map();
      
      try {
        await this.createDirectorySnapshot(sourceDir, entries, sourceSnapshot);
        this.logMessage(`移動準備: ${entries.length}個のアイテムを収集しました`);
      } catch (error) {
        throw new Error(`ディレクトリの読み取りに失敗: ${error.message}`);
      }

      let success = false;
      let newDir = null;
      
      try {
        newDir = await targetParent.getDirectoryHandle(dirName, { create: true });
        await this.recreateDirectoryContents(newDir, sourceSnapshot);
        
        if (await this.verifyMovedDirectory(newDir, sourceSnapshot)) {
          success = true;
        } else {
          throw new Error('移動先のディレクトリの検証に失敗しました');
        }
      } catch (error) {
        if (newDir) {
          try {
            await targetParent.removeEntry(dirName, { recursive: true });
          } catch (e) {
            console.warn('クリーンアップ中のエラー:', e);
          }
        }
        throw error;
      }

      if (success) {
        try {
          for (const entry of entries.reverse()) {
            try {
              if (entry.entry.kind === 'file') {
                await sourceDir.removeEntry(entry.entry.name);
              }
            } catch (e) {
              console.warn(`エントリの削除に失敗: ${entry.path}`, e);
            }
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          await new Promise(resolve => setTimeout(resolve, 200));
          await sourceDir.remove();
        } catch (error) {
          console.warn('移動元ディレクトリの削除に失敗:', error);
        }
      }

      this.switchPane(targetParent === this.currentHandles.left ? 'left' : 'right');

      const targetPane = document.querySelector(`.${targetParent === this.currentHandles.left ? 'left' : 'right'}-pane .file-list`);
      const items = Array.from(targetPane.querySelectorAll('.file-item'));
      const movedItem = items.find(item => item.querySelector('.name').textContent === dirName);

      if (movedItem) {
        this.focusFileItem(movedItem);
        this.lastFocusedPane = targetPane.closest('.pane');
        this.lastFocusedIndexes[targetParent === this.currentHandles.left ? 'left' : 'right'] = items.indexOf(movedItem);
      }

      return success;
    } catch (error) {
      throw new Error(`ディレクトリ ${dirName} の移動中にエラー: ${error.message}`);
    }
  };

  mainInstance.checkDirectoryExists = async function(parent, name) {
    try {
      await parent.getDirectoryHandle(name);
      return true;
    } catch {
      return false;
    }
  };

  mainInstance.moveFileHandle = async function(sourceHandle, targetHandle, itemName) {
    const sourceFile = await sourceHandle.getFileHandle(itemName);
    const targetFile = await targetHandle.getFileHandle(itemName, { create: true });

    const file = await sourceFile.getFile();
    const writable = await targetFile.createWritable();
    await writable.write(file);
    await writable.close();

    await sourceHandle.removeEntry(itemName);
  };

  mainInstance.createDirectorySnapshot = async function(directoryHandle, entries, snapshot, path = '') {
    for await (const entry of directoryHandle.values()) {
      const entryPath = `${path}/${entry.name}`;
      entries.push({ entry, path: entryPath });
      snapshot.set(entryPath, entry);

      if (entry.kind === 'directory') {
        const subDirHandle = await directoryHandle.getDirectoryHandle(entry.name);
        await this.createDirectorySnapshot(subDirHandle, entries, snapshot, entryPath);
      }
    }
  };

  mainInstance.recreateDirectoryContents = async function(targetDir, snapshot) {
    for (const [path, entry] of snapshot) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const newFile = await targetDir.getFileHandle(entry.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        const newDir = await targetDir.getDirectoryHandle(entry.name, { create: true });
        await this.recreateDirectoryContents(newDir, snapshot);
      }
    }
  };

  mainInstance.verifyMovedDirectory = async function(targetDir, snapshot) {
    for (const [path, entry] of snapshot) {
      try {
        if (entry.kind === 'file') {
          await targetDir.getFileHandle(entry.name);
        } else {
          await targetDir.getDirectoryHandle(entry.name);
        }
      } catch {
        return false;
      }
    }
    return true;
  };
}

window.initializeMoveOperations = initializeMoveOperations; 