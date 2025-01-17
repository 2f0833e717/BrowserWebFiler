// ユーティリティ機能のテストモジュール
QUnit.module('ユーティリティ機能のテスト', {
    beforeEach: function () {
        // テスト用のDOM要素を作成
        const appContainer = document.createElement('div');
        appContainer.className = 'app-container';

        const pathDisplay = document.createElement('div');
        pathDisplay.className = 'path-left';
        const currentPath = document.createElement('div');
        currentPath.className = 'current-path';
        pathDisplay.appendChild(currentPath);

        const fileManager = document.createElement('div');
        fileManager.className = 'file-manager';

        const leftPane = document.createElement('div');
        leftPane.id = 'left-pane';

        fileManager.appendChild(leftPane);
        appContainer.appendChild(pathDisplay);
        appContainer.appendChild(fileManager);
        document.body.appendChild(appContainer);
    },
    afterEach: function () {
        // テスト用の要素を削除
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.remove();
        }
    }
});

QUnit.test('パス表示の更新', function (assert) {
    const mainInstance = {
        currentPaths: { left: '/test/path', right: '/other/path' }
    };
    initializeUtils(mainInstance);
    mainInstance.updatePathDisplay('left');

    const pathElement = document.querySelector('.path-left .current-path');
    assert.equal(pathElement.textContent, '/test/path', 'パスが正しく表示されること');
});

QUnit.test('ファイルリストのレンダリング', function (assert) {
    const mainInstance = {
        currentPaths: { left: '/test/path', right: '/other/path' }
    };
    initializeUtils(mainInstance);

    const pane = document.getElementById('left-pane');
    const entries = [
        { name: 'test.txt', isDirectory: false },
        { name: 'folder', isDirectory: true },
        { name: 'a.txt', isDirectory: false }
    ];

    mainInstance.renderFileList(pane, entries);
    const items = pane.querySelectorAll('.file-item');

    assert.equal(items.length, 4, '親ディレクトリを含む4つの項目が表示されること');
    assert.ok(items[0].querySelector('.name').textContent === '..', '親ディレクトリが最初に表示されること');
    assert.ok(items[1].querySelector('.name').textContent === 'folder', 'ディレクトリが次に表示されること');
    assert.ok(items[2].querySelector('.name').textContent === 'a.txt', 'ファイルがアルファベット順で表示されること');
}); 