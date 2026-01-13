# StreamPulse

> リアルタイム配信監視 & AI予測ダッシュボード

StreamPulseは、Twitch、Kick、TwitCastingなどの複数の配信プラットフォームを横断してストリーマーをリアルタイムで追跡・監視するための最新のダッシュボードアプリケーションです。
洗練されたダークモードUIとスムーズなアニメーションにより、お気に入りの配信者の状況を一目で把握できます。

![StreamPulse Dashboard](https://placehold.co/1200x630/1a1a1a/FFF?text=StreamPulse+Dashboard)

## ✨ 主な機能

- **マルチプラットフォーム対応**: Twitch、Kick、TwitCastingのストリーマーを一元管理。
- **リアルタイム監視**: 配信状態（オンライン/オフライン）を自動で定期更新し、常に最新のステータスを表示。
- **リッチなダッシュボード**:
  - **Liveセクション**: 配信中のストリーマーを強調表示。
  - **Offline/予測セクション**: 次回の配信予測や履歴を表示（実装状況による）。
- **ストリーマー管理**: 配信者の追加・削除が簡単なモーダルインターフェース。
- **モダンなUI/UX**: グラスモーフィズムを取り入れた美しいデザインとインタラクティブな操作感。

## 🛠 技術スタック

このプロジェクトは最新のWeb技術を使用して構築されています。

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router採用)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: ESLint

## 🚀 始め方

ローカル環境でプロジェクトをセットアップして実行する手順です。

### 前提条件

- Node.js 18.17以上
- npm / yarn / pnpm / bun のいずれかのパッケージマネージャ

### インストール

1. リポジトリをクローンします:

   ```bash
   git clone https://github.com/AbeShohei/LiveNow.git
   cd LiveNow
   ```

2. 依存関係をインストールします:

   ```bash
   npm install
   # または
   yarn install
   # または
   pnpm install
   ```

### 開発サーバーの起動

以下のコマンドでローカルサーバーを立ち上げます:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、アプリケーションが表示されます。
`src/app/page.tsx` を編集すると、ホットリロードにより即座に反映されます。

## 📂 プロジェクト構成

- `src/app`: アプリケーションのページとルーティング定義
- `src/components`: 再利用可能なUIコンポーネント
- `src/hooks`: `useStreamers` などのカスタムフック
- `src/services`: 外部APIとの連携ロジック
- `src/types`: TypeScriptの型定義（Streamer, Platform等）
- `src/lib`: ユーティリティ関数やライブラリ設定

## 🤝 コントリビューション

プルリククエストは歓迎します。大きな変更を加える場合は、まずIssueを開いて議論してください。

## 📄 ライセンス

[MIT](LICENSE)
