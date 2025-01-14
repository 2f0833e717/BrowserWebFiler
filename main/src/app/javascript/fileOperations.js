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
      // 移動先の状態をクリーンアップ
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

      // ソースディレクトリのスナップショットを作成
      const entries = [];
      const sourceSnapshot = new Map();
      
      try {
        await this.createDirectorySnapshot(sourceDir, entries, sourceSnapshot);
        this.logMessage(`移動準備: ${entries.length}個のアイテムを収集しました`);
      } catch (error) {
        throw new Error(`ディレクトリの読み取りに失敗: ${error.message}`);
      }

      // 新しいディレクトリを作成して内容をコピー
      let success = false;
      let newDir = null;
      
      try {
        newDir = await targetParent.getDirectoryHandle(dirName, { create: true });
        await this.recreateDirectoryContents(newDir, sourceSnapshot);
        
        // 移動先の検証
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

      // 移動元のディレクトリを削除
      if (success) {
        try {
          // 移動元のディレクトリのエントリを個別に削除
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

          // 最後にソースディレクトリ自体を削除
          await new Promise(resolve => setTimeout(resolve, 200));
          await sourceDir.remove();
        } catch (error) {
          console.warn('移動元ディレクトリの削除に失敗:', error);
          // 削除に失敗しても移動自体は成功とみなす
        }
      }

      // ペイン移動を実行
      this.switchPane(targetParent === this.currentHandles.left ? 'left' : 'right');

      // フォーカスを設定
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

  mainInstance.removeDirectoryRecursively = async function(dirHandle) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'directory') {
        const subDir = await dirHandle.getDirectoryHandle(entry.name);
        await this.removeDirectoryRecursively(subDir);
      }
      await dirHandle.removeEntry(entry.name, { recursive: true });
    }
  };

  mainInstance.createDirectorySnapshot = async function(dir, entries, snapshot, path = '') {
    try {
      const dirEntries = await dir.values();
      for await (const entry of dirEntries) {
        const currentPath = path ? `${path}/${entry.name}` : entry.name;
        
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          const buffer = await file.arrayBuffer();
          snapshot.set(currentPath, {
            kind: 'file',
            data: buffer,
            name: entry.name
          });
        } else {
          snapshot.set(currentPath, {
            kind: 'directory',
            name: entry.name
          });
          const subDir = await entry.getDirectoryHandle(entry.name);
          await this.createDirectorySnapshot(subDir, entries, snapshot, currentPath);
        }
        entries.push({ path: currentPath, entry });
      }
    } catch (error) {
      throw new Error(`スナップショット作成中のエラー: ${error.message}`);
    }
  };

  mainInstance.recreateDirectoryContents = async function(targetDir, snapshot) {
    let processedCount = 0;
    for (const [path, item] of snapshot) {
      try {
        const pathParts = path.split('/');
        let currentDir = targetDir;

        if (pathParts.length > 1) {
          for (const part of pathParts.slice(0, -1)) {
            currentDir = await currentDir.getDirectoryHandle(part, { create: true });
          }
        }

        if (item.kind === 'file') {
          const newFile = await currentDir.getFileHandle(item.name, { create: true });
          const writable = await newFile.createWritable();
          await writable.write(item.data);
          await writable.close();
        }

        processedCount++;
        if (processedCount % 5 === 0) {
          this.logMessage(`移動進捗: ${processedCount}/${snapshot.size}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.warn(`エントリ ${path} の処理中にエラー: ${error.message}`);
      }
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

  mainInstance.verifyMovedDirectory = async function(dir, snapshot) {
    try {
      for (const [path] of snapshot) {
        const pathParts = path.split('/');
        let currentDir = dir;
        
        for (const part of pathParts.slice(0, -1)) {
          currentDir = await currentDir.getDirectoryHandle(part);
        }
        
        const item = snapshot.get(path);
        if (item.kind === 'file') {
          await currentDir.getFileHandle(item.name);
        } else {
          await currentDir.getDirectoryHandle(item.name);
        }
      }
      return true;
    } catch (error) {
      console.error('検証エラー:', error);
      return false;
    }
  };

  mainInstance.copyFile = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const { sourceSide, targetSide, sourceHandle, targetHandle } = this.getSourceAndTargetHandles(item);

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      // 上書き確認
      const targetExists = await this.checkFileExists(targetHandle, itemName);
      if (targetExists && !confirm(`ファイル「${itemName}」は既に存在します。上書きしますか？`)) {
        this.exitCommandMode();
        return;
      }

      const sourceFile = await sourceHandle.getFileHandle(itemName);
      const targetFile = await targetHandle.getFileHandle(itemName, { create: true });

      const file = await sourceFile.getFile();
      const writable = await targetFile.createWritable();
      await writable.write(file);
      await writable.close();

      await this.updateUIAfterOperation(sourceSide, targetSide, itemName, 'コピー');
    } catch (error) {
      this.logError(error);
      this.exitCommandMode();
    }
  };

  mainInstance.copyDirectory = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const { sourceSide, targetSide, sourceHandle, targetHandle } = this.getSourceAndTargetHandles(item);

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

      // 上書き確認
      const targetExists = await this.checkDirectoryExists(targetHandle, itemName);
      if (targetExists && !confirm(`フォルダ「${itemName}」は既に存在します。上書きしますか？`)) {
        this.exitCommandMode();
        return;
      }

      if (targetExists) {
        await targetHandle.removeEntry(itemName, { recursive: true });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const sourceDir = await sourceHandle.getDirectoryHandle(itemName);
      await this.copyDirectoryRecursive(sourceDir, targetHandle, itemName);

      await this.updateUIAfterOperation(sourceSide, targetSide, itemName, 'コピー');
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

      const isDirectory = item.querySelector('.icon').textContent.includes('📁');
      const type = isDirectory ? 'フォルダ' : 'ファイル';
      if (!confirm(`${type}「${itemName}」を削除してもよろしいですか？`)) {
        this.exitCommandMode();
        return;
      }

      await handle.removeEntry(itemName, { recursive: true });
      await this.loadDirectoryContents(side);

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

  mainInstance.getSourceAndTargetHandles = function(item) {
    const sourcePane = item.closest('.pane');
    const sourceSide = sourcePane.classList.contains('left-pane') ? 'left' : 'right';
    const targetSide = sourceSide === 'left' ? 'right' : 'left';

    return {
      sourceSide,
      targetSide,
      sourceHandle: this.currentHandles[sourceSide],
      targetHandle: this.currentHandles[targetSide]
    };
  };

  mainInstance.moveFileHandle = async function(sourceHandle, targetHandle, sourceName) {
    const sourceFile = await sourceHandle.getFileHandle(sourceName);
    const targetFile = await targetHandle.getFileHandle(sourceName, { create: true });
    
    const file = await sourceFile.getFile();
    const writable = await targetFile.createWritable();
    await writable.write(file);
    await writable.close();
    
    await sourceHandle.removeEntry(sourceName);
  };

  mainInstance.updateUIAfterOperation = async function(sourceSide, targetSide, itemName, operation) {
    try {
      // ファイルシステムの状態を安定させる
      await new Promise(resolve => setTimeout(resolve, 500));

      // 両方のペインのハンドルを更新
      const sourceHandle = await this.refreshDirectoryHandle(sourceSide);
      const targetHandle = await this.refreshDirectoryHandle(targetSide);
      
      if (sourceHandle && targetHandle) {
        // ハンドルを更新
        this.currentHandles[sourceSide] = sourceHandle;
        this.currentHandles[targetSide] = targetHandle;

        // UIを更新
        await Promise.all([
          this.loadDirectoryContentsWithoutFocus(sourceSide),
          this.loadDirectoryContentsWithoutFocus(targetSide)
        ]);

        // 状態を安定させる
        await new Promise(resolve => setTimeout(resolve, 200));

        // 移動先のアイテムにフォーカスを設定
        const targetPane = document.querySelector(`.${targetSide}-pane .file-list`);
        const items = Array.from(targetPane.querySelectorAll('.file-item'));
        
        if (items.length > 0) {
          const movedItem = items.find(item => 
            item.querySelector('.name').textContent === itemName
          );

          if (movedItem) {
            this.focusFileItem(movedItem);
            this.lastFocusedPane = targetPane.closest('.pane');
            this.lastFocusedIndexes[targetSide] = items.indexOf(movedItem);
          } else {
            this.focusFileItem(items[0]);
            this.lastFocusedPane = targetPane.closest('.pane');
            this.lastFocusedIndexes[targetSide] = 0;
          }
        }
      }

      this.logMessage(`${itemName}を${sourceSide}から${targetSide}に${operation}しました`);
    } catch (error) {
      this.logError(`UI更新中にエラー: ${error.message}`);
    } finally {
      this.exitCommandMode();
    }
  };

  mainInstance.refreshDirectoryHandle = async function(side) {
    try {
      const currentPath = this.currentPaths[side];
      const pathParts = currentPath.split('\\').filter(part => part);
      let handle = this.rootHandles[side];

      for (const part of pathParts) {
        if (part === this.rootHandles[side].name) continue;
        handle = await handle.getDirectoryHandle(part);
      }

      return handle;
    } catch (error) {
      this.logError(new Error(`ディレクトリハンドルの更新に失敗: ${error.message}`));
      return null;
    }
  };

  mainInstance.checkFileExists = async function(parent, name) {
    try {
      await parent.getFileHandle(name);
      return true;
    } catch {
      return false;
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
window.initializeFileOperations = initializeFileOperations;
