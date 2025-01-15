function initializeCopyOperations(mainInstance) {
  mainInstance.copyFile = async function(item) {
    if (!item) return;

    try {
      const itemName = item.querySelector('.name').textContent;
      const { sourceSide, targetSide, sourceHandle, targetHandle } = this.getSourceAndTargetHandles(item);

      if (!sourceHandle || !targetHandle) {
        throw new Error('コピー元またはコピー先のディレクトリが選択されていません');
      }

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
}

window.initializeCopyOperations = initializeCopyOperations; 