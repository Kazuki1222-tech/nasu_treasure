# GitHub 通知設定ガイド

このドキュメントは、`nasu_treasure` の監視結果を GitHub からメールで受け取るための設定手順です。

対象リポジトリ:

- `https://github.com/Kazuki1222-tech/nasu_treasure`

通知先メールアドレス:

- `chakazuki@gmail.com`

この監視は `GitHub Actions` で 30 分おきに実行されます。  
`2026-04-11` または `2026-04-12` が予約可能になったときに、次の 2 経路で GitHub 通知が飛ぶ想定です。

1. `Actions` 実行失敗通知
2. `Issue` 作成と `@Kazuki1222-tech` メンション通知

## 1. 先に理解しておくこと

このプロジェクト自身が Gmail を直接送るわけではありません。  
GitHub が送る通知メールを受け取る構成です。

そのため、あなたの GitHub アカウント側で次を有効にする必要があります。

1. `chakazuki@gmail.com` を GitHub アカウントに登録して確認済みにする
2. GitHub の通知メールを有効にする
3. `Actions` と `Issues` の通知を受け取れるようにする

## 2. GitHub にログインする

1. ブラウザで `https://github.com/` を開く
2. 右上の `Sign in` から `Kazuki1222-tech` でログインする

## 3. `chakazuki@gmail.com` を GitHub に登録する

1. 右上のプロフィール画像を押す
2. `Settings` を押す
3. 左メニューの `Emails` を押す
4. `Add email address` を押す
5. `chakazuki@gmail.com` を入力する
6. GitHub から届く確認メールを開く
7. メール内の `Verify email address` を押す

確認できたら、`Emails` 画面で `chakazuki@gmail.com` が `Verified` になっていることを確認します。

### `Error adding chakazuki@gmail.com: email is already in use` と出たとき

これは、`chakazuki@gmail.com` がすでに別の GitHub アカウントに登録されている意味です。  
この repo の問題ではなく、GitHub アカウント側の状態です。

対処は次の順です。

1. まず、`chakazuki@gmail.com` を使っている別の GitHub アカウントがないか思い出す
2. 心当たりがある場合は、そのアカウントにログインする
3. `Settings` → `Emails` を開く
4. `chakazuki@gmail.com` が登録されていたら、そのアカウントから外す
5. その後、今使っている `Kazuki1222-tech` 側で再度 `Add email address` を実行する

昔のアカウント名を忘れている場合は、`chakazuki@gmail.com` で GitHub のパスワード再設定を試してください。  
そのメールアドレスに紐づくアカウントが分かれば、そのアカウントに入ってメール設定を整理できます。

もし今すぐ `chakazuki@gmail.com` を移せない場合でも、現在の GitHub アカウントで `Verified` になっている別メールアドレスがあれば、ひとまずそのアドレスで通知確認はできます。  
監視自体は止まりません。違うのは、GitHub 通知メールの受け取り先だけです。

## 4. 通知メールを有効にする

1. 右上のプロフィール画像を押す
2. `Settings` を押す
3. 左メニューの `Notifications` を押す
4. `Email notification preferences` を開く
5. メール通知が有効になっていることを確認する
6. 通知先として `chakazuki@gmail.com` が選べる場合は、そのアドレスを選ぶ

ここで重要なのは、GitHub からの通知メール自体を止めていないことです。

## 5. `Actions` 通知を有効にする

1. `Settings` → `Notifications` のまま下へ進む
2. `Actions` に関する通知設定を確認する
3. `Email` が有効になるように設定する

この監視では、予約可能になったときに workflow を一度だけ `failed` にします。  
この失敗通知を GitHub メールとして受け取るための設定です。

## 6. リポジトリ通知を有効にする

1. `https://github.com/Kazuki1222-tech/nasu_treasure` を開く
2. 右上付近の `Watch` を押す
3. まずは `All Activity` か `Custom` を選ぶ

`Custom` を使う場合は次を有効にしてください。

- `Issues`
- `Pull Requests` は不要
- `Actions`
- `Mentions`

今回の alert は `Issue` 作成と `@Kazuki1222-tech` メンションを使うので、`Issues` と `Mentions` は有効にしておく方が安全です。

## 7. 手動で一度動作確認する

1. リポジトリの `Actions` タブを開く
2. 左の一覧から `RESERVA Monitor` を押す
3. 右上の `Run workflow` を押す
4. branch が `main` になっていることを確認する
5. `Run workflow` を押す

数十秒待つと run が完了します。

## 8. 実行結果を見る

1. さっき起動した run を押す
2. `check` ジョブを開く
3. `Run monitor` のログを確認する
4. 画面右か下の `Artifacts` を開く
5. `reserva-monitor-...` をダウンロードする

現時点では、JSON に次のような結果が出ていれば正常です。

- `pageState: "calendar"`
- `20260411: "unavailable"`
- `20260412: "unavailable"`

## 9. 予約可能になったときに何が起きるか

どちらかの日付が予約可能になったら、workflow は次を行います。

1. GitHub Issue を 1 件作成する
2. Issue 本文で `@Kazuki1222-tech` をメンションする
3. その run を一度だけ `failed` にする

この 2 本立てで通知されます。

- `Actions failure` のメール
- `Issue / Mention` のメール

## 10. 監視頻度を変える方法

監視頻度を変えるファイル:

- `.github/workflows/reserva-monitor.yml`

今の設定:

```yaml
cron: "*/30 * * * *"
```

意味:

- 30 分おき

変更例:

- 1 時間おき: `0 * * * *`
- 15 分おき: `*/15 * * * *`

変更したら GitHub に push すれば反映されます。

## 11. メールが来ないときの確認順

1. `chakazuki@gmail.com` が GitHub で `Verified` か
2. GitHub の `Notifications` でメール通知が有効か
3. リポジトリの `Watch` が `Custom` で `Issues` `Actions` `Mentions` を含んでいるか
4. Gmail の `迷惑メール` に入っていないか
5. `Actions` の run が本当に `failed` になっているか
6. Issue が作成されているか

## 12. 覚えておくこと

この監視は、相手サイト側の bot 判定や画面変更の影響を受けます。  
そのため、今後もし `Cloudflare challenge` が増えた場合は、監視基盤の見直しが必要です。

ただし、現状の GitHub Actions 実行では以下が確認できています。

- workflow 実行成功
- artifact 保存成功
- 対象日付の DOM 判定成功
