// キーボードイベントのテストモジュール
QUnit.module('キーボードイベントのテスト', {
    beforeEach: function () {
        // キーボードイベントのモックを設定
        this.keyboardEventSpy = {
            events: [],
            handleEvent: function (event) {
                this.events.push(event);
            }
        };
        document.addEventListener('keydown', this.keyboardEventSpy.handleEvent.bind(this.keyboardEventSpy));
    },
    afterEach: function () {
        // イベントリスナーを削除
        document.removeEventListener('keydown', this.keyboardEventSpy.handleEvent.bind(this.keyboardEventSpy));
    }
});

QUnit.test('キーボードショートカット - Ctrl+S', function (assert) {
    const event = MockKeyboardEvent.createKeyEvent('keydown', 'S', true);
    document.dispatchEvent(event);

    assert.equal(this.keyboardEventSpy.events.length, 1, 'イベントが1回発生すること');
    assert.equal(this.keyboardEventSpy.events[0].key, 'S', 'キーが正しいこと');
    assert.ok(this.keyboardEventSpy.events[0].ctrlKey, 'Ctrlキーが押されていること');
});

QUnit.test('キーボードショートカット - Shift+Tab', function (assert) {
    const event = MockKeyboardEvent.createKeyEvent('keydown', 'Tab', false, true);
    document.dispatchEvent(event);

    assert.equal(this.keyboardEventSpy.events.length, 1, 'イベントが1回発生すること');
    assert.equal(this.keyboardEventSpy.events[0].key, 'Tab', 'キーが正しいこと');
    assert.ok(this.keyboardEventSpy.events[0].shiftKey, 'Shiftキーが押されていること');
});

QUnit.test('複数のキーイベント', function (assert) {
    const events = [
        MockKeyboardEvent.createKeyEvent('keydown', 'A', true),
        MockKeyboardEvent.createKeyEvent('keydown', 'B', true),
        MockKeyboardEvent.createKeyEvent('keydown', 'C', true)
    ];

    events.forEach(event => document.dispatchEvent(event));

    assert.equal(this.keyboardEventSpy.events.length, 3, '3つのイベントが発生すること');
    assert.deepEqual(
        this.keyboardEventSpy.events.map(e => e.key),
        ['A', 'B', 'C'],
        'キーの順序が正しいこと'
    );
}); 