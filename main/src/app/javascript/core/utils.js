function initializeUtils(mainInstance) {
  mainInstance.updatePathDisplay = function(side) {
    const pathElement = document.querySelector(`.path-${side} .current-path`);
    if (pathElement) {
      pathElement.textContent = this.currentPaths[side] || '';
    }
  };

  mainInstance.renderFileList = function(pane, entries) {
    if (!pane) return;
    
    pane.innerHTML = '';
    // 「..」追加
    const upEntry = { name: '..', isDirectory: true };
    entries.unshift(upEntry);
    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).forEach(entry => {
      const element = document.createElement('div');
      element.className = 'file-item';
      element.innerHTML = `
        <span class="icon">${entry.isDirectory ? '📁' : '📄'}</span>
        <span class="name">${entry.name}</span>
      `;
      pane.appendChild(element);
    });
  };
}

// グローバルスコープに追加
window.initializeUtils = initializeUtils; 