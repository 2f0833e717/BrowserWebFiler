// テスト時間管理
const testTimeManager = {
    startTime: null,
    endTime: null,

    start() {
        this.startTime = new Date();
        this.updateStartTime();
    },

    end() {
        this.endTime = new Date();
        this.updateEndTime();
        this.updateDuration();
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    },

    updateStartTime() {
        document.getElementById('testStartTime').textContent = 
            `開始時刻: ${this.formatDate(this.startTime)}`;
    },

    updateEndTime() {
        document.getElementById('testEndTime').textContent = 
            `終了時刻: ${this.formatDate(this.endTime)}`;
    },

    updateDuration() {
        const duration = this.endTime - this.startTime;
        const seconds = (duration / 1000).toFixed(2);
        document.getElementById('testDuration').textContent = 
            `実行時間: ${seconds} 秒`;
    }
};

// QUnitのコールバックを設定
QUnit.begin(() => {
    testTimeManager.start();
});

QUnit.done(() => {
    testTimeManager.end();
}); 