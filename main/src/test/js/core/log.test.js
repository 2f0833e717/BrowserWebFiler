// ログ機能のテストモジュール
QUnit.module('ログ機能のテスト', {
    beforeEach: function () {
        // テスト用のログ表示領域を作成
        const logContainer = document.createElement('div');
        logContainer.className = 'log-container';
        const logContent = document.createElement('div');
        logContent.className = 'log-content';
        logContainer.appendChild(logContent);
        document.body.appendChild(logContainer);
    },
    afterEach: function () {
        // テスト用の要素を削除
        const logContainer = document.querySelector('.log-container');
        if (logContainer) {
            logContainer.remove();
        }
    }
});

QUnit.test('エラーログの出力', function (assert) {
    const mainInstance = {};
    initializeLog(mainInstance);

    const error = new Error('テストエラー');
    mainInstance.logError(error);

    const logContent = document.querySelector('.log-content');
    assert.ok(logContent.textContent.includes('テストエラー'), 'エラーメッセージが出力されること');
});

QUnit.test('メッセージログの出力', function (assert) {
    const mainInstance = {};
    initializeLog(mainInstance);

    const message = 'テストメッセージ';
    mainInstance.logMessage(message);

    const logContent = document.querySelector('.log-content');
    assert.ok(logContent.textContent.includes(message), 'ログメッセージが出力されること');
    assert.ok(logContent.textContent.includes(new Date().toLocaleDateString()), 'タイムスタンプが含まれること');
}); 