// ファイルシステムのモック
class MockFileSystem {
    constructor() {
        this.files = new Map();
        this.directories = new Map();
    }

    // ファイルの作成
    createMockFile(name, content, type = 'text/plain') {
        const file = new File([content], name, { type });
        const handle = {
            kind: 'file',
            name: name,
            getFile: async () => file
        };
        this.files.set(name, handle);
        return handle;
    }

    // ディレクトリの作成
    createMockDirectory(name, entries = []) {
        const handle = {
            kind: 'directory',
            name: name,
            entries: entries,
            getEntries: async function* () {
                for (const entry of this.entries) {
                    yield entry;
                }
            }
        };
        this.directories.set(name, handle);
        return handle;
    }

    // ファイル選択ダイアログのモック
    async mockShowOpenFilePicker(options = {}) {
        const fileHandle = this.createMockFile('test.txt', 'テストファイルの内容');
        return [fileHandle];
    }

    // ディレクトリ選択ダイアログのモック
    async mockShowDirectoryPicker() {
        const fileHandle = this.createMockFile('sample.txt', 'サンプルテキスト');
        const dirHandle = this.createMockDirectory('testDir', [fileHandle]);
        return dirHandle;
    }
}

// キーボードイベントのモック
class MockKeyboardEvent {
    static createKeyEvent(type, key, ctrlKey = false, shiftKey = false) {
        return new KeyboardEvent(type, {
            key: key,
            ctrlKey: ctrlKey,
            shiftKey: shiftKey,
            bubbles: true,
            cancelable: true
        });
    }
}

// UIイベントのモック
class MockUIEvent {
    static createClickEvent(x, y) {
        return new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
    }

    static createDragEvent(type, x, y) {
        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
        });
    }
}

// ウィンドウ管理のモック
class MockWindow {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
    }

    // 新しいウィンドウを開く
    open(url, name, features) {
        const mockWin = {
            closed: false,
            name: name,
            location: url,
            close: function() {
                this.closed = true;
            }
        };
        this.windows.set(name, mockWin);
        this.activeWindow = mockWin;
        return mockWin;
    }

    // ウィンドウを閉じる
    close(name) {
        const win = this.windows.get(name);
        if (win) {
            win.close();
            this.windows.delete(name);
            return true;
        }
        return false;
    }

    // ウィンドウの状態を確認
    isWindowOpen(name) {
        const win = this.windows.get(name);
        return win && !win.closed;
    }
}

// グローバルスコープに追加
window.MockFileSystem = MockFileSystem;
window.MockKeyboardEvent = MockKeyboardEvent;
window.MockUIEvent = MockUIEvent;
window.MockWindow = MockWindow;
window.mockWindowManager = new MockWindow(); 