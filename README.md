# NEMO : THE LAST RECORD v0.2
## PARALLEL WORLD EDITION

「ねもの出生の秘密」を扱う記録復元型ノベルゲーム。

v0.2では設定の根幹を改稿し、PROJECT N.E.M.O.を
「一人のねもを一つの世界へ逃がす計画」から、
「滅びる原世界のNEMOを、接続可能な無数の並行世界へ分岐・継承させる計画」
へ変更しました。

## 正史の核

- 原世界は `WORLD-0000`
- ねもは原世界の王家第一子
- 原世界そのものが寿命を迎え、消滅する
- 王家の研究で、世界の外側に無数の並行世界が存在すると判明
- 単一の転送先を選ぶことはできない
- PROJECT N.E.M.O.を起動すると、NEMOの存在は接続可能な世界線へ分岐する
- 分岐後の各NEMOは「原物とコピー」ではない
- 全員が同じ過去から連続した、それぞれ独立したNEMO
- 転送／分岐の代償として原世界の長期記憶はほぼ失われる
- 各世界線には記録者の系譜が残り、NEMOを「守る・導かない・王女扱いしない・記録する」
- 今作でプレイヤーが見ているねもは `WORLD-0001` のNEMO
- 別世界のNEMOも存在するが、今作はWORLD-0001の人生に焦点を絞る
- パラレル設定を「何でもあり」の装置にはしない

## THE LAST RECORD の意味

「最後の一人」という意味ではありません。

滅びた `WORLD-0000` から残された、
すべてのNEMOが共有する最後の原記録です。

原世界は終わった。
しかし、そこからNEMOの未来が無数に始まった。

## v0.2 で追加・変更したもの

- `REC-028 / MANY WORLDS`
- 並行世界の発見
- PROJECT N.E.M.O.の全面改稿
- 「本物／コピー」という区別を否定する正史
- `WORLD ID` 表示
- `WORLD-0001 / 0002 / 0137` の存在
- 分岐イベント演出
- エンディング文章の全面改稿
- クリア後 `RECORD NEMO` に別世界線の記録を追加
- v0.1とセーブデータを分離

## 起動方法

`index.html` をブラウザで開いてください。

## GitHub Pages

フォルダ内の
`index.html / style.css / game.js`
をリポジトリ直下に配置すれば動作します。

## 現在の位置づけ

シナリオとゲーム構造を最後まで遊べるプロトタイプです。
画像・BGM・SEは未実装です。

次版では、
- 原世界の王宮
- 幼いねも
- WORLD BRANCH MAP
- 転送室
- WORLD-0001の現代ねも
などの専用イラストを入れる想定です。


## v0.2.1 UI Fix
- ARCHIVE / RECORD NEMO / MENU のオーバーレイUIが上側で途切れる問題を修正
- オーバーレイを縦中央配置から上寄せ配置に変更
- パネル自体にスクロールを持たせ、長文でも見切れにくく調整
- 見出し部分を追いやすいように調整
- スマホ時の余白も微調整


## v0.2.2 Text Fix
- 王の台詞を「そこへ、わが子を送れるのか。」に修正


## v0.2.3 Title / OGP Update
- タイトル画面の背景にキービジュアル `title-hero.png` を追加
- OGP用画像 `ogp.png` を追加（1200x630）
- Open Graph / Twitter Card メタタグを追加
- URL共有時にプレビュー画像が出るよう調整


## v0.2.4 Title / OGP / Favicon Update
- タイトル画面の背景オーバーレイを強化し、文字の可読性を向上
- タイトル周辺に text-shadow を追加して読みやすく調整
- 文字入り専用OGP画像 `ogp.png` に差し替え
- `favicon.png` / `favicon.ico` を追加
- HTML に favicon 用の link タグを追加


## v0.3 CINEMATIC RECORD EDITION

文章量を増やさず、「間・光・ノイズ・音・暗転」で物語を読ませる演出版。

### 追加演出
- REC切り替え時の復元率演出
- 重要台詞のクリック不能な短い「間」
- MANY WORLDS / PROJECT N.E.M.O. / BRANCH EVENT の世界線エフェクト
- PROJECT N.E.M.O.起動時の白フラッシュと微振動
- WORLD-0000 : SIGNAL LOST の暗転と音の消失
- 現代編で音と光を柔らかく切り替え
- 最終選択肢を端末認証風に変更
- クリア後タイトル画面の雰囲気を微変化
- クリア後タイトル画面で10秒待つと WORLD-0137 の隠しログ
- 2周目以降に SKIP 機能解放
- SOUND ON/OFF 切り替え
- 外部音源なし。WebAudioで低いドローン、機械音、微かなノイズを生成

### セーブ
v0.3はv0.2系と別のlocalStorageキーを使用。
過去版のセーブには干渉しません。


## v0.3.1 Clear-state Foreshadowing Update
- クリア後、RECORD 000 の表示タイトルを `UNKNOWN FILE` から `ORIGIN RECORD` に変更
- ARCHIVE内の `REC-000` タイトルもクリア後は `ORIGIN RECORD` 表示に変更
- 物語クリア後に、原記録だったことがUI上でも回収される演出を追加


## v0.3.2 Royal Garden Photo Update
- `RECORD 009 / GARDEN` に専用ビジュアル `royal-garden-photo.png` を追加
- `PRIVATE PHOTO / ROYAL GARDEN` と `ANNOTATION` の両シーンで画像表示
- ビジュアル枠に画像をきれいに収めるための scene image 表示スタイルを追加
- テキストUIになじむよう、下部に控えめなキャプション表示へ調整


## v0.3.3 Mobile Scene Image / Typo Fix
- エンディング内の誤字 `ねま` を `ねも` に修正
- `RECORD 009 / GARDEN` 用にスマホ表示向けの切り出し画像 `royal-garden-photo-mobile.png` を追加
- 画面幅が狭い時はスマホ用画像を自動表示
- スマホ時の画像キャプションサイズも微調整


## v0.3.4 World Decay Illustration Update
- `RECORD 014 / WORLD DECAY` に終末現象ビジュアル `world-decay-photo.png` を追加
- `OBSERVATORY LOG / ASTROPHYSICAL TERMINAL / WORLD LIFE EXPECTANCY / CLASSIFIED` の各シーンで表示
- スマホ向け切り出し画像 `world-decay-photo-mobile.png` を追加
- 画面幅が狭い時はスマホ向け画像を自動表示
