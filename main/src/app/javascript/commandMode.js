function initializeCommandMode(mainInstance) {
  mainInstance.enableCommandMode = function(item) {
    if (!item) return;
    
    this.commandMode = true;
    item.classList.remove('focused');
    item.classList.add('command-focused');
  };

  mainInstance.toggleCommandMode = function(item) {
    if (!item) return;
    
    this.commandMode = !this.commandMode;
    if (this.commandMode) {
      item.classList.remove('focused');
      item.classList.add('command-focused');
    } else {
      item.classList.remove('command-focused');
      item.classList.add('focused');
    }
  };

  mainInstance.exitCommandMode = function() {
    const commandFocusedItem = document.querySelector('.file-item.command-focused');
    if (commandFocusedItem) {
      commandFocusedItem.classList.remove('command-focused');
      commandFocusedItem.classList.add('focused');
      this.commandMode = false;
    }
  };
}

// グローバルスコープに追加
window.initializeCommandMode = initializeCommandMode;
