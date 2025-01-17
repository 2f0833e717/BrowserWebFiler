// ファイル操作に関する関数
class FileOperations {
    constructor() {
        this.currentFile = null;
    }

    async openFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            this.currentFile = file;
            return await file.text();
        } catch (error) {
            console.error('ファイルを開く際にエラーが発生しました:', error);
            throw error;
        }
    }

    getCurrentFileName() {
        return this.currentFile ? this.currentFile.name : null;
    }
}

// グローバルに利用できるようにする
window.FileOperations = FileOperations; 