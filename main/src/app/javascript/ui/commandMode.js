function initializeCommandMode(mainInstance) {
  mainInstance.enableCommandMode = function() {
    this.commandMode = true;
    document.body.classList.add('command-mode');
    
    const focusedItem = document.querySelector('.file-item.focused');
    if (focusedItem) {
      focusedItem.classList.remove('focused');
      focusedItem.classList.add('command-focused');
    }
  };

  mainInstance.disableCommandMode = function() {
    this.commandMode = false;
    document.body.classList.remove('command-mode');
    
    const focusedItem = document.querySelector('.file-item.command-focused');
    if (focusedItem) {
      focusedItem.classList.remove('command-focused');
      focusedItem.classList.add('focused');
    }
  };

  mainInstance.toggleCommandMode = function() {
    if (this.commandMode) {
      this.disableCommandMode();
    } else {
      this.enableCommandMode();
    }
  };
}

// グローバルスコープに追加
window.initializeCommandMode = initializeCommandMode; 