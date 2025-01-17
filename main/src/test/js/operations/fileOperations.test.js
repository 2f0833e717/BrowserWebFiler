// ファイル操作のテストモジュール
QUnit.module('ファイルシステム操作のテスト', {
    beforeEach: function () {
        // モックファイルシステムの初期化
        window.mockFS = new MockFileSystem();
        // 複数ファイル選択用のモック関数を上書き
        window.mockFS.mockShowOpenFilePicker = async function(options = {}) {
            if (options.multiple) {
                return [
                    this.createMockFile('file1.txt', 'コンテンツ1'),
                    this.createMockFile('file2.txt', 'コンテンツ2')
                ];
            }
            return [this.createMockFile('test.txt', 'テストファイルの内容')];
        };
        window.showOpenFilePicker = window.mockFS.mockShowOpenFilePicker.bind(window.mockFS);
        window.showDirectoryPicker = window.mockFS.mockShowDirectoryPicker.bind(window.mockFS);
    },
    afterEach: function () {
        delete window.mockFS;
    }
});

QUnit.test('ファイル選択ダイアログ', async function (assert) {
    const done = assert.async();
    try {
        const fileHandles = await window.showOpenFilePicker();
        assert.equal(fileHandles.length, 1, 'ファイルが1つ選択されること');
        assert.equal(fileHandles[0].name, 'test.txt', 'ファイル名が正しいこと');

        const file = await fileHandles[0].getFile();
        const content = await file.text();
        assert.equal(content, 'テストファイルの内容', 'ファイル内容が正しいこと');
        done();
    } catch (error) {
        assert.ok(false, 'エラーが発生しました: ' + error.message);
        done();
    }
});

QUnit.test('ディレクトリ選択ダイアログ', async function (assert) {
    const done = assert.async();
    try {
        const dirHandle = await window.showDirectoryPicker();
        assert.equal(dirHandle.name, 'testDir', 'ディレクトリ名が正しいこと');

        const entries = [];
        for await (const entry of dirHandle.getEntries()) {
            entries.push(entry);
        }
        assert.equal(entries.length, 1, 'ディレクトリ内のファイル数が正しいこと');
        assert.equal(entries[0].name, 'sample.txt', 'ファイル名が正しいこと');
        done();
    } catch (error) {
        assert.ok(false, 'エラーが発生しました: ' + error.message);
        done();
    }
});

QUnit.test('複数ファイルの選択', async function (assert) {
    const done = assert.async();
    try {
        const fileHandles = await window.showOpenFilePicker({
            multiple: true
        });

        assert.equal(fileHandles.length, 2, '2つのファイルが選択されること');
        
        // 各ファイルの内容を確認
        const file1 = await fileHandles[0].getFile();
        const content1 = await file1.text();
        assert.equal(content1, 'コンテンツ1', '1つ目のファイル内容が正しいこと');

        const file2 = await fileHandles[1].getFile();
        const content2 = await file2.text();
        assert.equal(content2, 'コンテンツ2', '2つ目のファイル内容が正しいこと');

        done();
    } catch (error) {
        assert.ok(false, 'エラーが発生しました: ' + error.message);
        done();
    }
});

QUnit.test('ディレクトリ内のファイル列挙', async function (assert) {
    const done = assert.async();
    try {
        // モックディレクトリの作成
        const fileHandle1 = window.mockFS.createMockFile('test1.txt', 'テスト1');
        const fileHandle2 = window.mockFS.createMockFile('test2.txt', 'テスト2');
        const dirHandle = window.mockFS.createMockDirectory('testDir', [fileHandle1, fileHandle2]);

        const entries = [];
        for await (const entry of dirHandle.getEntries()) {
            entries.push(entry);
        }

        assert.equal(entries.length, 2, 'ディレクトリ内のファイル数が正しいこと');
        assert.ok(entries.some(e => e.name === 'test1.txt'), 'test1.txtが存在すること');
        assert.ok(entries.some(e => e.name === 'test2.txt'), 'test2.txtが存在すること');
        done();
    } catch (error) {
        assert.ok(false, 'エラーが発生しました: ' + error.message);
        done();
    }
}); 