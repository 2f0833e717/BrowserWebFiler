# Browser Web Filer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome](https://img.shields.io/badge/Chrome-Latest-green.svg)](https://www.google.com/chrome/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-blue.svg)](https://www.javascript.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/2f0833e717/browserwebfiler/graphs/commit-activity)

[![Github issues](https://img.shields.io/github/issues/2f0833e717/browserwebfiler)](https://github.com/2f0833e717/browserwebfiler/issues)
[![Github forks](https://img.shields.io/github/forks/2f0833e717/browserwebfiler)](https://github.com/2f0833e717/browserwebfiler/network/members)
[![Github stars](https://img.shields.io/github/stars/2f0833e717/browserwebfiler)](https://github.com/2f0833e717/browserwebfiler/stargazers)
[![Github top language](https://img.shields.io/github/languages/top/2f0833e717/browserwebfiler)](https://github.com/2f0833e717/browserwebfiler/)
[![Github license](https://img.shields.io/github/license/2f0833e717/browserwebfiler)](https://github.com/2f0833e717/browserwebfiler/)

![Development Status](https://img.shields.io/badge/Status-Beta-yellow.svg)
![CodeFactor](https://www.codefactor.io/repository/github/2f0833e717/browserwebfiler/badge)
![Sponsor](https://img.shields.io/badge/Sponsor-♥-red.svg)
<a href="https://github.com/2f0833e717/browserwebfiler/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=2f0833e717/browserwebfiler" />
</a>

## 目次

- [概要](#概要)
- [特徴](#特徴)
- [動作環境](#動作環境)
- [制限事項](#制限事項)
- [キーボードショートカット](#キーボードショートカット)
  - [起動時](#起動時)
  - [フォーカス操作](#フォーカス操作)
  - [コマンドモード](#コマンドモード)
  - [ファイル作成](#ファイル作成)
  - [その他](#その他)
- [プロジェクト構成](#プロジェクト構成)
- [使用方法](#使用方法)
- [セキュリティ考慮事項](#セキュリティ考慮事項)
- [パフォーマンス考慮事項](#パフォーマンス考慮事項未検証事項)
- [開発者向け情報](#開発者向け情報)
- [ライセンス](#ライセンス)
- [作者](#作者)
- [貢献](#貢献)
- [バグ報告](#バグ報告)
- [謝辞](#謝辞)

## 概要

ブラウザベースの2画面ファイルマネージャーです。キーボード操作を重視し、効率的なファイル管理を実現します。

## 特徴

- 2画面（左右ペイン）のファイル操作
- キーボードショートカットによる効率的な操作
- ダークテーマ対応
- 操作ログの表示
- ディレクトリ履歴機能
- ファイル/フォルダの基本操作（コピー、移動、削除、作成）

## 動作環境

- モダンブラウザ（Chrome推奨）
- ローカル環境での実行（サーバー不要）
- File System Access API対応ブラウザ

## 制限事項

- システムファイルエリア（C:/等）はブラウザのセキュリティ仕様上、アクセス不可
- Tabキーでのフォーカス移動非対応
- ファイル編集機能なし
- ファイル/フォルダ名の編集機能なし
- ドラッグ＆ドロップ非対応
- ソート種類の変更不可
- インクリメンタルサーチ非対応（ブラウザのCtrl + Fで代用）
- ブラウザリロード時のキャッシュデータ保持なし

## キーボードショートカット

### 起動時
- n : フォルダを選択

### フォーカス操作
- Shift + o : 反対側のペインを同期
- → : 右ペインに移動/親ディレクトリに移動
- ← : 左ペインに移動/親ディレクトリに移動
- ↑/↓ : ファイル選択の移動
- PageUp : 最初のファイルに移動
- PageDown : 最後のファイルに移動
- Enter/Double Click : フォルダに移動

### コマンドモード
- Space : コマンドモードのON/OFF
- m : ファイル/フォルダの移動
- c : ファイル/フォルダのコピー
- d : ファイル/フォルダの削除
- Escape : コマンドモードを終了

### ファイル作成
- Shift + k : 新規フォルダを作成
- Shift + e : 新規ファイルを作成

### その他
- h : ディレクトリ履歴を表示
- Shift + / : ヘルプを表示
- Ctrl + w : 終了（ブラウザデフォルト）

## プロジェクト構成

```
main/
├── src/
│   └── app/
│       ├── html/         # HTMLファイル
│       │   └── index.html
│       ├── css/          # スタイルシート
│       │   └── style.css
│       └── javascript/   # JavaScriptモジュール
│           ├── core/     # コア機能
│           ├── events/   # イベント処理
│           ├── operations/ # ファイル操作
│           └── ui/       # UI関連
└── docs/
    ├── design/          # 設計ドキュメント
    └── develop/         # 開発者向け資料
```

## 使用方法

1. プロジェクトをローカルに配置
2. `main/src/app/html/index.html` をブラウザで開く
3. 「フォルダを選択」ボタンで作業フォルダを選択
4. キーボードショートカットでファイル操作

## セキュリティ考慮事項

- ファイルアクセス権限の確認
- パス操作のバリデーション
- エラー情報の適切な表示

## パフォーマンス考慮事項(未検証事項)

- 大規模ディレクトリの効率的な読み込み
- UIの応答性確保
- メモリ使用量の最適化

## 開発者向け情報

詳細な設計資料は `main/docs/design/` ディレクトリを参照してください。
開発関連のメモや規約は `main/docs/develop/` ディレクトリにあります。

## ライセンス

MIT License

## 作者

[2f0833e717]

## 貢献

1. このリポジトリをフォーク
2. 機能追加用のブランチを作成
3. 変更をコミット
4. ブランチをプッシュ
5. プルリクエストを作成

## バグ報告

GitHubのIssueを使用してバグを報告してください。
以下の情報を含めてください：

- バグの詳細な説明
- 再現手順
- 期待される動作
- 実際の動作
- ブラウザのバージョン

## 謝辞

このプロジェクトは以下のAPIとリソースを使用しています：

- File System Access API
