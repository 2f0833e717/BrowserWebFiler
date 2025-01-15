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

    logHeader.addEventListener('mousedown', (e) => {
      // ヘッダーの上部領域でドラッグ
      if (e.offsetY <= 10) {
        isDragging = true;
        startY = e.clientY;
        startHeight = logContainer.offsetHeight;
        document.body.style.cursor = 'ns-resize';
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const newHeight = Math.min(
        Math.max(startHeight + deltaY, 0), // 最小高さ100px
        window.innerHeight * 1 // 最大高さ画面80%
      );

      logContainer.style.height = `${newHeight}px`;
      document.querySelector('.app-container').style.paddingBottom = `${newHeight}px`;
      document.querySelector('.file-manager').style.height = 
        `calc(100vh - ${newHeight}px - 50px)`;

      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
      }
    });

    // ダブルクリックで高さデフォルト
    logHeader.addEventListener('dblclick', (e) => {
      if (e.offsetY <= 10) {
        const defaultHeight = window.innerHeight * 0.2; // 20vh
        logContainer.style.height = `${defaultHeight}px`;
        document.querySelector('.app-container').style.paddingBottom = `${defaultHeight}px`;
        document.querySelector('.file-manager').style.height = 
          `calc(100vh - ${defaultHeight}px - 50px)`;
      }
    });
  };
}

// グローバルスコープに追加
window.initializeLog = initializeLog; 