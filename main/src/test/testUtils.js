// テスト結果の保存機能
function saveTestResult() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'QUnitTestResult.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// 日時フォーマット用の関数
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// テスト時間の表示を管理するクラス
class TestTimeManager {
    constructor() {
        this.startTime = new Date();
        this.container = document.getElementById('test-time-container');
    }

    initialize() {
        this.container.innerHTML = '';
        const timeInfo = document.createElement('div');
        timeInfo.className = 'test-time-info';
        timeInfo.innerHTML = `
            <div>開始時刻: ${formatDateTime(this.startTime)}</div>
            <div id="endTimeInfo">終了時刻: 実行中...</div>
            <div id="durationInfo">実行時間: 計測中...</div>
        `;
        this.container.appendChild(timeInfo);
    }

    updateEndTime() {
        const endTime = new Date();
        const duration = (endTime - this.startTime) / 1000;

        document.getElementById('endTimeInfo').textContent = `終了時刻: ${formatDateTime(endTime)}`;
        document.getElementById('durationInfo').textContent = `実行時間: ${duration.toFixed(2)} 秒`;

        console.log('=== テスト実行情報 ===');
        console.log(`開始時刻: ${formatDateTime(this.startTime)}`);
        console.log(`終了時刻: ${formatDateTime(endTime)}`);
        console.log(`実行時間: ${duration.toFixed(2)} 秒`);
        console.log('==================');
    }
}

// テストユーティリティ関数
const TestUtils = {
    // モックファイルシステムの作成
    createMockFileSystem() {
        return {
            files: {
                'test-file.txt': new File(['テストコンテンツ'], 'test-file.txt', { type: 'text/plain' }),
                'test-folder/': {
                    'sub-file.txt': new File(['サブファイルコンテンツ'], 'sub-file.txt', { type: 'text/plain' })
                }
            }
        };
    },

    // DOMイベントの発火をシミュレート
    triggerEvent(element, eventType, options = {}) {
        const event = new Event(eventType, { bubbles: true, ...options });
        element.dispatchEvent(event);
    },

    // ドラッグ&ドロップイベントのシミュレート
    simulateDragAndDrop(sourceElement, targetElement) {
        this.triggerEvent(sourceElement, 'dragstart');
        this.triggerEvent(targetElement, 'dragover');
        this.triggerEvent(targetElement, 'drop');
    },

    // モックshowOpenFilePickerの作成
    async mockShowOpenFilePicker() {
        return [{
            kind: 'file',
            name: 'test-file.txt',
            getFile: async () => new File(['テストコンテンツ'], 'test-file.txt', { type: 'text/plain' })
        }];
    },

    // テスト用のDOM要素を作成
    createTestElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    }
};

// グローバルにエクスポート
window.TestUtils = TestUtils; 