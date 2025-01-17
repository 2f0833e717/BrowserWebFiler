// テスト結果レポーター
const testReporter = {
    results: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        tests: []
    },

    // テスト結果をHTML形式で生成
    generateHTML() {
        const date = new Date();
        const formattedDate = new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);

        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>テスト実行結果 - ${formattedDate}</title>
    <style>
        body {
            background-color: #1e1e1e;
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 20px;
        }
        .summary {
            background-color: #2d2d2d;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .test-case {
            background-color: #333333;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .pass {
            border-left: 5px solid #4CAF50;
        }
        .fail {
            border-left: 5px solid #f44336;
        }
        .assertion {
            margin-left: 20px;
            padding: 5px;
            font-family: monospace;
        }
        .time-info {
            color: #888888;
        }
        h1, h2 {
            color: #4CAF50;
        }
        .status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            margin-right: 10px;
        }
        .status-pass {
            background-color: #143214;
            color: #4CAF50;
        }
        .status-fail {
            background-color: #321414;
            color: #f44336;
        }
    </style>
</head>
<body>
    <h1>テスト実行結果</h1>
    <div class="summary">
        <h2>実行サマリー</h2>
        <p>実行日時: ${formattedDate}</p>
        <p>総テスト数: ${this.results.total}</p>
        <p>成功: ${this.results.passed}</p>
        <p>失敗: ${this.results.failed}</p>
        <p>スキップ: ${this.results.skipped}</p>
        <p>実行時間: ${this.results.duration.toFixed(2)}ms</p>
    </div>
    <div class="test-cases">
        <h2>テストケース詳細</h2>
        ${this.results.tests.map(test => `
            <div class="test-case ${test.failed ? 'fail' : 'pass'}">
                <span class="status ${test.failed ? 'status-fail' : 'status-pass'}">
                    ${test.failed ? '失敗' : '成功'}
                </span>
                <strong>${test.name}</strong>
                <span class="time-info">(${test.runtime}ms)</span>
                ${test.assertions.map(assertion => `
                    <div class="assertion">
                        ✓ ${assertion.message}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    },

    // テスト結果をダウンロード可能なHTMLとして保存
    saveResults() {
        const html = this.generateHTML();
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'testResultCheck.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// QUnitのコールバックを設定
QUnit.begin(function() {
    testReporter.results.total = 0;
    testReporter.results.passed = 0;
    testReporter.results.failed = 0;
    testReporter.results.skipped = 0;
    testReporter.results.tests = [];
});

QUnit.testDone(function(details) {
    testReporter.results.tests.push({
        name: details.name,
        module: details.module,
        failed: details.failed > 0,
        passed: details.passed,
        runtime: details.runtime,
        assertions: details.assertions
    });
});

QUnit.done(function(details) {
    testReporter.results.total = details.total;
    testReporter.results.passed = details.passed;
    testReporter.results.failed = details.failed;
    testReporter.results.skipped = details.skipped;
    testReporter.results.duration = details.runtime;
    
    // テスト結果をHTMLファイルとして保存
    testReporter.saveResults();
}); 