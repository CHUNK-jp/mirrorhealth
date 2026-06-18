# 🪞 MirrorHealth

**あなたの健康データを、あなたのデバイスだけで、AIが分析します。**

Apple Health・Garmin・Oura Ring のデータをローカルLLM（Ollama）で分析するプライバシーファーストな健康ダッシュボード。クラウドに一切送信しません。

![MirrorHealth Dashboard](docs/screenshot.png)

## ✨ 機能

- 📊 **健康ダッシュボード** — 歩数・心拍数・睡眠・HRV・アクティブエネルギーを美しいチャートで表示
- 🤖 **ローカルAI分析** — Ollama経由でLLMがあなたの健康トレンドを分析・アドバイス
- 🔒 **完全ローカル処理** — データは一切外部に送信されない
- 🌐 **日本語/英語対応** — AI分析を両言語で生成
- 📱 **Apple Health対応** — `export.xml` をそのままドロップするだけ

## 🚀 セットアップ

### 必要なもの

- Node.js 18以上
- [Ollama](https://ollama.com) インストール済み

### 1. Ollamaのセットアップ

```bash
# Ollamaをインストール（https://ollama.com からダウンロード）

# モデルをダウンロード（日本語対応が良い場合は qwen2.5 推奨）
ollama pull llama3.2

# または日本語に強いモデル
ollama pull qwen2.5:7b

# Ollamaを起動
ollama serve
```

### 2. MirrorHealthを起動

```bash
# クローン
git clone https://github.com/YOUR_USERNAME/mirrorhealth.git
cd mirrorhealth

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 3. Apple Healthデータのエクスポート

1. iPhoneの **ヘルスケア** アプリを開く
2. 右上の **プロフィールアイコン** をタップ
3. 一番下にある **「ヘルスケアデータを書き出す」** をタップ
4. 送られてきたZipファイルを展開
5. `apple_health_export/export.xml` をMirrorHealthにドロップ

## ⚙️ 環境変数（オプション）

`.env.local` ファイルを作成してカスタマイズできます：

```env
# OllamaのURL（デフォルト: http://localhost:11434）
OLLAMA_BASE_URL=http://localhost:11434

# デフォルトモデル（デフォルト: llama3.2）
OLLAMA_MODEL=qwen2.5:7b
```

## 🗺️ ロードマップ

- [ ] Garmin FIT ファイル対応
- [ ] Oura Ring JSON 対応
- [ ] Samsung Health 対応
- [ ] Markdown/PDFレポートエクスポート
- [ ] 複数期間の比較ビュー
- [ ] 家族アカウント対応（MirrorHealth Pro）

## 🛠️ 技術スタック

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + Recharts
- **Parser**: xml2js + date-fns
- **AI**: Ollama（ローカルLLM）
- **Language**: TypeScript

## 📄 ライセンス

MIT License — 自由に使用・改変・再配布できます。

---

**⭐ このプロジェクトが役に立ったら、GitHubでスターをお願いします！**
