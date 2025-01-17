// UIイベントのテストモジュール
QUnit.module('UIイベントのテスト', {
    beforeEach: function () {
        // テスト用のDOM要素を作成
        const container = document.createElement('div');
        container.id = 'test-container';
        container.style.width = '200px';
        container.style.height = '200px';
        container.style.overflow = 'auto';
        document.body.appendChild(container);

        const content = document.createElement('div');
        content.style.width = '400px';
        content.style.height = '400px';
        container.appendChild(content);
    },
    afterEach: function () {
        const container = document.getElementById('test-container');
        if (container) {
            container.remove();
        }
    }
});

QUnit.test('クリックイベント', function (assert) {
    const element = document.createElement('div');
    document.body.appendChild(element);

    let clicked = false;
    element.addEventListener('click', () => clicked = true);

    const event = MockUIEvent.createClickEvent(10, 10);
    element.dispatchEvent(event);

    assert.ok(clicked, 'クリックイベントが発生すること');
    document.body.removeChild(element);
});

QUnit.test('ドラッグ操作', function (assert) {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '0px';
    element.style.top = '0px';
    document.body.appendChild(element);

    let dragStarted = false;
    let dragEnded = false;

    element.addEventListener('dragstart', () => dragStarted = true);
    element.addEventListener('dragend', () => dragEnded = true);

    // ドラッグ開始イベント
    const dragStartEvent = MockUIEvent.createDragEvent('dragstart', 0, 0);
    element.dispatchEvent(dragStartEvent);

    // ドラッグ終了イベント
    const dragEndEvent = MockUIEvent.createDragEvent('dragend', 100, 100);
    element.dispatchEvent(dragEndEvent);

    assert.ok(dragStarted, 'ドラッグが開始されること');
    assert.ok(dragEnded, 'ドラッグが終了すること');
    document.body.removeChild(element);
});

QUnit.test('スクロール操作', function (assert) {
    const done = assert.async();
    const container = document.getElementById('test-container');
    let scrolled = false;

    container.addEventListener('scroll', () => {
        scrolled = true;
        assert.ok(true, 'スクロールイベントが発生すること');
        assert.equal(container.scrollTop, 50, 'Y方向のスクロール位置が正しいこと');
        assert.equal(container.scrollLeft, 50, 'X方向のスクロール位置が正しいこと');
        done();
    });

    // スクロールイベントを発火
    const event = new Event('scroll', { bubbles: true });
    container.scrollTo(50, 50);
    container.dispatchEvent(event);
});

QUnit.test('ダブルクリックイベント', function (assert) {
    const element = document.createElement('div');
    document.body.appendChild(element);

    let doubleClicked = false;
    element.addEventListener('dblclick', () => doubleClicked = true);

    const event = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    element.dispatchEvent(event);

    assert.ok(doubleClicked, 'ダブルクリックイベントが発生すること');
    document.body.removeChild(element);
}); 