function initializeUtils(mainInstance) {
  mainInstance.enableCommandMode = function(item) {
    if (item) {
      item.classList.add('command-focused');
      this.commandMode = true;
    }
  };

  mainInstance.exitCommandMode = function() {
    const commandFocusedItem = document.querySelector('.file-item.command-focused');
    if (commandFocusedItem) {
      commandFocusedItem.classList.remove('command-focused');
      commandFocusedItem.classList.add('focused');
    }
    this.commandMode = false;
  };

  mainInstance.toggleCommandMode = function(item) {
    if (this.commandMode) {
      this.exitCommandMode();
    } else {
      this.enableCommandMode(item);
    }
  };
}

// グローバルスコープに追加
window.initializeUtils = initializeUtils; 