// モックファイルシステムの設定
const mockFileSystem = {
    files: new Map(),
    directories: new Set(),

    // ファイルの追加
    addFile(path, content) {
        this.files.set(path, new File([content], path.split('/').pop(), { type: 'text/plain' }));
    },

    // ディレクトリの追加
    addDirectory(path) {
        this.directories.add(path);
    },

    // ファイルの取得
    getFile(path) {
        return this.files.get(path);
    },

    // ディレクトリの存在確認
    hasDirectory(path) {
        return this.directories.has(path);
    },

    // ファイルの存在確認
    hasFile(path) {
        return this.files.has(path);
    },

    // ファイルの削除
    removeFile(path) {
        return this.files.delete(path);
    },

    // ディレクトリの削除
    removeDirectory(path) {
        return this.directories.delete(path);
    },

    // 全てクリア
    clear() {
        this.files.clear();
        this.directories.clear();
    }
};

// テストスイートの定義
QUnit.module('ファイル操作テスト', {
    beforeEach() {
        mockFileSystem.clear();
        // テスト用のファイルとディレクトリを設定
        mockFileSystem.addDirectory('/test-dir');
        mockFileSystem.addFile('/test-dir/test.txt', 'テストコンテンツ');
    }
});

// ファイル作成テスト
QUnit.test('ファイル作成', async function(assert) {
    const filePath = '/test-dir/new-file.txt';
    const content = '新しいファイルの内容';
    
    mockFileSystem.addFile(filePath, content);
    
    assert.true(mockFileSystem.hasFile(filePath), 'ファイルが作成されている');
    const file = mockFileSystem.getFile(filePath);
    assert.equal(file.name, 'new-file.txt', 'ファイル名が正しい');
    
    const fileContent = await file.text();
    assert.equal(fileContent, content, 'ファイルの内容が正しい');
});

// ファイル削除テスト
QUnit.test('ファイル削除', function(assert) {
    const filePath = '/test-dir/test.txt';
    
    assert.true(mockFileSystem.hasFile(filePath), '削除前にファイルが存在する');
    mockFileSystem.removeFile(filePath);
    assert.false(mockFileSystem.hasFile(filePath), 'ファイルが削除されている');
});

// ディレクトリ作成テスト
QUnit.test('ディレクトリ作成', function(assert) {
    const dirPath = '/new-dir';
    
    mockFileSystem.addDirectory(dirPath);
    assert.true(mockFileSystem.hasDirectory(dirPath), 'ディレクトリが作成されている');
});

// ディレクトリ削除テスト
QUnit.test('ディレクトリ削除', function(assert) {
    const dirPath = '/test-dir';
    
    assert.true(mockFileSystem.hasDirectory(dirPath), '削除前にディレクトリが存在する');
    mockFileSystem.removeDirectory(dirPath);
    assert.false(mockFileSystem.hasDirectory(dirPath), 'ディレクトリが削除されている');
}); 