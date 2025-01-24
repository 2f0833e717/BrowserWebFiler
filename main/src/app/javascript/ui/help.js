function initializeHelp(mainInstance) {
  mainInstance.showKeyboardHelp = function() {
    const helpMessages = [
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '[KEYBOARD SHORTCUT HELP]',
      '[START UP]',
      'n :                      フォルダを選択',
      '',
      '[FORCUS CURSOR]',
      'Shift + O :              反対側のペインを同期',
      '→ :                      右ペインに移動/親ディレクトリに移動',
      '← :                      左ペインに移動/親ディレクトリに移動',
      '↑/↓ :                    ファイル選択の移動',
      'PageUp :                 最初のファイルに移動',
      'PageDown :               最後のファイルに移動',
      'Enter:                   フォルダに移動',
      'Double Click :           フォルダに移動',
      '',
      '[COMMAND CURSOR]',
      'Space :                  コマンドモードのON / OFF',
      'm :                      コマンドモードON、ファイル / フォルダの移動',
      'c :                      コマンドモードON、ファイル / フォルダのコピー',
      'd :                      コマンドモードON、ファイル / フォルダの削除',
      'Escape :                 コマンドモードOFF',
      '',
      '[CREATE DIRECTORY / FILE]',
      'Shift + k :              新規フォルダを作成',
      'Shift + e :              新規ファイルを作成',
      '',
      '[OTHER / HELP]',
      'h :                      ディレクトリ履歴を表示',
      'Shift + / :              このヘルプを表示',
      'Ctrl + W :               Exit(ブラウザデフォルトショートカット)',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ''
    ];

    helpMessages.forEach(message => {
      mainInstance.logMessage(message);
    });
  };
}

// グローバルスコープに追加
window.initializeHelp = initializeHelp; 