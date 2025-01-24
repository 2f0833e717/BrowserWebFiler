function initializeLog(mainInstance) {
  mainInstance.logError = function(error) {
    console.error(error);
    const logContent = document.querySelector('.log-content');
    const errorElement = document.createElement('div');
    errorElement.textContent = `Error: ${error.message}`;
    logContent.appendChild(errorElement);
  };

  mainInstance.logMessage = function(message) {
    const logContent = document.querySelector('.log-content');
    const messageElement = document.createElement('div');
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}.${now.getMilliseconds()}`;
    messageElement.textContent = `${timestamp} - ${message}`;
    logContent.appendChild(messageElement);
    logContent.scrollTop = logContent.scrollHeight;
  };

  mainInstance.initializeLogResize = function() {
    const logContainer = document.querySelector('.log-container');
    const logHeader = document.querySelector('.log-header');
    let isDragging = false;
    let startY;
    let startHeight;
    let currentHeight;

    // ドラッグ開始時の処理
    const startDragging = (e) => {
      // ヘッダーの上部10px領域でのみドラッグを開始
      if (e.offsetY <= 10) {
        isDragging = true;
        startY = e.clientY;
        startHeight = logContainer.offsetHeight;
        currentHeight = startHeight;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      }
    };

    // ドラッグ中の処理
    const doDrag = (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      currentHeight = Math.min(
        Math.max(startHeight + deltaY, 30), // 最小高さ30px
        window.innerHeight * 0.95 // 最大高さ画面の95%
      );

      // CSSカスタムプロパティを更新
      document.documentElement.style.setProperty('--log-height', `${currentHeight}px`);
      
      // コンテナの高さを設定
      logContainer.style.height = `${currentHeight}px`;

      e.preventDefault();
    };

    // ドラッグ終了時の処理
    const stopDragging = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        
        // 高さを確定
        if (currentHeight) {
          logContainer.style.height = `${currentHeight}px`;
        }
      }
    };

    // イベントリスナーの設定
    logHeader.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDragging);

    // ダブルクリックでデフォルトサイズに戻す
    logHeader.addEventListener('dblclick', (e) => {
      if (e.offsetY <= 10) {
        const defaultHeight = Math.max(window.innerHeight * 0.2, 30); // 20vhまたは最小30px
        currentHeight = defaultHeight;
        logContainer.style.height = `${defaultHeight}px`;
        document.documentElement.style.setProperty('--log-height', `${defaultHeight}px`);
      }
    });
  };
}

// グローバルスコープに追加
window.initializeLog = initializeLog; 