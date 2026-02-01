# U-MOS 自動入力 & Teams 返信 Web アプリ

このリポジトリは U-MOS の出退勤を自動で入力し（Playwright を使用）、出勤時に Teams スレッドへ返信するための Web アプリのサンプルです。

## 準備
1. Python 3.8+ を用意します。
2. 仮想環境を作成して有効化します。
3. 依存パッケージをインストールします:

   pip install -r requirements.txt

4. Playwright のブラウザをインストールします:

   playwright install

5. `.env` をルートに作成し、`.env.example` を参考に値を埋めます。特に以下を設定してください:
   - UMOS_URL, UMOS_USER, UMOS_PASS
   - U-MOS ページ要素のセレクタ（`UMOS_*_SELECTOR`）
   - Microsoft Graph のアプリ情報（`GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`）
   - `GRAPH_TEAM_ID`, `GRAPH_CHANNEL_ID`, `GRAPH_THREAD_SEARCH_TEXT`

6. Graph API を使うには適切な権限（Application: ChannelMessage.Read.All / ChannelMessage.Send など）を Azure AD で付与してください。

## 実行
   FLASK_DEBUG=1 python app.py

## 注意点
- U-MOS のセレクタは環境依存です。`app.py` の `UMOS_SELECTORS` を `.env` に合わせて必ず更新してください（TODO コメントあり）。
- Microsoft Graph の権限設定と承認（Admin consent）が必要です。動作確認はテスト環境で行ってください。
- .env に ID/パスワードなどの機密情報を入れる際は、安全に管理してください。

