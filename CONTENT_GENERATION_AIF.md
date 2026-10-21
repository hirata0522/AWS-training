# AIF-C01コンテンツ生成ランブック（定期実行エージェント用）

このファイルは、`js/data/aif-c01.js` のコンテンツ（単語・想定問題・模擬試験プール）を
目標件数まで段階的に増やすための手順書。定期実行のクラウドエージェント（ルーティン）が
**毎回ゼロから**このファイルを読んで作業する前提で書かれている。会話の記憶は引き継がれない。

CLF-C02用の `CONTENT_GENERATION.md` と同じ仕組みだが、(1) **単語（VOCAB）は「先に全単語リストを
作り、上から順に埋める」方式**、(2) **想定問題・模擬試験は並び替え(ordering)・組み合わせ(matching)形式も
作る**、の2点が異なる（後述）。アプリはホーム画面でCLF-C02/AIF-C01を切り替えられ、`js/data/aif-c01.js`
に追加した項目はそのまま出題される。このルーティンの仕事はデータを増やすことだけ（アプリのコードは触らない）。

## 試験の基本情報（2026-10-19にWebFetchで確認）

- AWS Certified AI Practitioner (AIF-C01)。65問（採点対象50問＋採点対象外15問）、90分、合格点700/1000。
- 試験ガイドは **v1.1（2026-04-30公開）**。v1.0から目標・対象サービスが大きく更新されている
  （エージェント型AI、MCP、コンテキストエンジニアリング、トークン課金、モデル蒸留、LLM-as-a-judge、
  Bedrock AgentCore、Kiro、Strands Agents、Amazon Quick、Bedrock Prompt Management、
  ハルシネーション検出とグラウンディング 等が追加。Amazon MemoryDBは対象外に）。
  **古い問題集の知識（v1.0準拠）ではなく、v1.1の目標に沿って作ること。**
- 公式ページ:
  - 試験ガイド: https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html
  - ドメイン1〜5のタスク・スキル: 同ディレクトリの `ai-practitioner-01-domain1.html` 〜 `ai-practitioner-01-domain5.html`
  - 対象サービス: https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/aif-01-in-scope-services.html
  - 対象外サービス: 同ディレクトリの `aif-01-out-of-scope-services.html`
  - 改訂履歴: https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/aif-01-revisions.html
  - **毎回の実行の最初に改訂履歴ページを確認し**、v1.1より新しい版が出ていたら、進捗ログにその旨と
    主な変更点を記録し、以降の追加をその版に合わせること（既存項目の修正はしない。提案として記録する）。

## ドメインと目標

ドメインキー（`js/data/aif-c01.js` の `DOMAINS`）と出題比率:

| キー | ドメイン | 比率 |
|---|---|---|
| `aiml` | 1: AIと機械学習の基礎 (Fundamentals of AI and ML) | 20% |
| `genai` | 2: 生成AIの基礎 (Fundamentals of GenAI) | 24% |
| `fm` | 3: 基盤モデルの応用 (Applications of Foundation Models) | 28% |
| `responsible` | 4: 責任あるAIのガイドライン (Guidelines for Responsible AI) | 14% |
| `security` | 5: AIソリューションのセキュリティ、コンプライアンス、ガバナンス | 14% |

| プール | 変数 | 目標 |
|---|---|---|
| 単語問題 | `VOCAB` | **単語リストの行数**（`content/aif-c01-vocab-list.md`。500前後を想定、不足なら増やしてよい） |
| 想定問題（カジュアル） | `PRACTICE` | 1500 |
| 模擬試験専用プール | `MOCK_POOL` | 500 |

現在の件数は `python3 scripts/validate_content.py aif-c01` で確認する（**引数 `aif-c01` を忘れないこと**。
引数なしだとCLF-C02の検証になる）。

## 単語リスト方式（VOCAB専用ルール）

`content/aif-c01-vocab-list.md` に、出題すべき全単語を先に列挙し、上から順にVOCABへ埋めていく。

### リストのフォーマット（検証スクリプトが解析するので厳守）

```markdown
| # | 用語 | ドメイン | 状態 |
|---|---|---|---|
| 1 | Amazon Bedrock | genai | v1 |
| 2 | Amazon SageMaker AI | aiml | v2 |
| 3 | Fine-tuning | fm | 未 |
```

- `#` は1からの連番（欠番・重複なし、表の行順と一致）。
- `用語` はVOCABの `term` と**完全一致**させる英語表記（例: `Retrieval Augmented Generation (RAG)`）。
  `|` 文字は使わない。大文字小文字違いの重複も不可。
- `ドメイン` は上表のキーのいずれか。
- `状態` は未作成なら `未`、作成済みならそのVOCAB項目のID（`v12` 等）、見送りなら `除外`。
- 表の外（見出しや説明文）は自由に書いてよいが、表の行と紛らわしい `|` 始まりの行は表以外に書かない。

### リストがまだ存在しない場合（初回）

その回は**単語リストの作成を最優先**とする（その回のVOCAB追加は0件でよい。PRACTICE/MOCK_POOLは
時間に余裕があれば追加してよい）。

1. ドメイン1〜5の公式ページ（上記URL）をWebFetchで全て読み、各タスク・スキルに例示された用語を
   漏れなく拾う（例: 1.1.1の AI/ML/deep learning/neural networks/computer vision/NLP/model/algorithm/
   training/inferencing/bias/fairness/fit/LLM/GenAI/agentic AI、3.4.2の ROUGE/BLEU/BERTScore/LLM-as-a-judge 等）。
2. 対象サービス一覧の**全サービス**を入れる（AI/ML系はもちろん、S3・IAM・KMS・CloudTrail等の周辺サービスも
   AIの文脈で問われるため含める）。主要な機能名（例: Amazon Bedrock Guardrails、Bedrock Knowledge Bases、
   Bedrock Agents、Bedrock Model Evaluation、Bedrock Prompt Management、AgentCore Identity、
   SageMaker Clarify、SageMaker Model Cards、SageMaker Model Monitor、SageMaker Data Wrangler、
   SageMaker Feature Store、Amazon Augmented AI (A2I)、AWS PrivateLink 等）も独立した用語として入れる。
3. 試験ガイドに明示されていなくても、上記を理解するのに必要な基本用語（例: トークン、埋め込み、
   ベクトルデータベース、temperature、top-p、過学習/学習不足、適合率/再現率、プロンプトインジェクション、
   ジェイルブレイク等）を加える。
4. 並び順は「基礎→応用」。各ドメインの基本用語を先に、派生・応用用語を後にする。ドメインが偏らないよう、
   ある程度ドメインを混ぜて並べてよい（埋める順番＝学習で出てくる順番になるため）。
5. 規模は500前後を目安とするが、**数合わせで無理に500にしない／足りなければ500を超えてよい**。
   試験範囲に無関係・廃止済み・ガイドで対象外と明記されたサービスは入れない。
6. 既にVOCABにある項目（`v1` Amazon Bedrock、`v2` Amazon SageMaker AI 等）は、リストに含めて状態欄に
   そのIDを書く（検証スクリプトは、リストに紐付いていないVOCAB項目をエラーにする）。
7. 作成後 `python3 scripts/validate_content.py aif-c01` がエラーなしであることを確認してコミットする。

### リストが存在する場合（2回目以降）

- 状態が `未` の行を**上から順に**取り、その用語のVOCAB項目を作る。作ったら状態欄をそのIDに書き換える。
- 作ってみて試験範囲外・公式ページで事実確認できない・他の行と実質重複と判断した用語は、行を削除せず
  状態を `除外` にし、進捗ログに理由を書いて次の行に進む（`除外` の行はVOCABの目標件数から差し引かれる）。
  行の削除・並べ替えはしない。
- 作業中に重要な用語の漏れに気づいたら、リストの**末尾**に追記してよい（連番を続ける）。
- ドメイン比率はリスト全体で概ね上表に沿っていればよく、各回のVOCAB追加分の比率は気にしなくてよい。

## 1回の実行手順

0. **作業前に必ず** `git branch --show-current` 等で現在のブランチを確認し、`master` でなければ
   `git checkout master` してから `git pull --rebase origin master` を実行し、最新状態から始めること。
   **新しいブランチを作らない。** 変更は必ず`master`に直接コミット・pushする（PRは作らない）。
   detached HEADや、ローカル`master`が`origin/master`と無関係な履歴を指している場合の対処は
   `CONTENT_GENERATION.md` の手順0と同じ（退避ブランチに改名してから`origin/master`で作り直す。削除しない）。
1. 試験ガイドの改訂履歴ページを確認する（上記「試験の基本情報」参照）。
2. `python3 scripts/validate_content.py aif-c01` を実行し、現在の件数（プール別・ドメイン別・単語リスト進捗）を確認する。
   - 失敗（exit code != 0）する場合、既存データが壊れている。新規追加は行わず、まずそのエラーを報告すること
     （直せる範囲なら直してよいが、無理に推測で直さない）。
3. 単語リストが無ければ「リストがまだ存在しない場合」を実施する。
4. 3プールすべてが目標件数に達していたら、**何もせず終了**する（コミットしない）。
5. 今回追加する件数の予算を決める（目安: 合計15〜25件程度）。
   - 各プールの残り件数（目標-現在、0未満は0）に比例して配分する。
   - PRACTICE/MOCK_POOLは、ドメイン別件数が目標比率（20/24/28/14/14）からどれだけ離れているかを見て、
     不足しているドメインを優先的に補う。VOCABはリストの順番どおり。
6. 新規項目を作成する。**既存の項目は絶対に変更・削除しない**。IDは各プールの現在の最大値+1から
   連番で振る（`VOCAB`は`v`、`PRACTICE`は`p`、`MOCK_POOL`は`m`）。

### 項目の作り方（必読・精度に関する重要ルール）

- **ファイルの構造**: `js/data/aif-c01.js` は全体が即時関数 `(function(){ ... })();` で囲まれており、
  末尾で `window.EXAMS['aif-c01']` に自分を登録している（アプリは複数試験を同時に読み込むため、
  `var VOCAB` 等はファイル内だけのローカル変数）。新規項目は各配列（`VOCAB`/`PRACTICE`/`MOCK_POOL`）の
  閉じ `];` の直前に追加し、**末尾の登録ブロックと先頭・末尾の即時関数は変更しない**。
  IDは試験ごとに独立（CLF-C02にも `v1` があるが衝突しない。進捗も試験ごとに分けて保存される）。
- データ構造は既存の項目をそのまま真似ること。文字列はシングルクォート。文中にシングルクォートを使う場合は
  `\'` でエスケープする。`VOCAB`は従来どおりネストした`q:{...}`で4択・`correct`は整数。
- `PRACTICE`/`MOCK_POOL` は本番と同じ4つの形式（`type`）に対応している。
  - `single`（単一選択）: `choices` 4つ、`correct:[正解の添字]`、`why` は `choices` と同数。
  - `multi`（複数選択）: 本番同様 **5択で正解2つ** を基本とする（4〜6択・正解2つ以上まで許容）。
    問題文に「（2つ選択）」のように正解数を明記する。`why` は `choices` と同数。
  - `ordering`（並び替え）: `items` に3〜5個の手順を **正しい順に** 並べて書く（アプリが表示時にシャッフルする）。
    `correct`・`choices` は書かない。`why` は `items` と同数で、各手順がその位置に来る理由を書く。
    公式ドキュメントで順序がはっきり示されている手順（例: MLワークフロー、RAGの処理の流れ、
    モデルのカスタマイズの手順）だけを題材にし、順序に解釈の余地があるものは作らない。
    ```js
    {id:'p3', domain:'aiml', type:'ordering', source:SOURCES.xxx, text:'…を順に並べてください。',
      items:['手順1','手順2','手順3','手順4'],
      why:['手順1の理由','手順2の理由','手順3の理由','手順4の理由']},
    ```
  - `matching`（組み合わせ）: `prompts` に3〜7個の項目（ユースケース等）、`options` にプロンプト数以上
    7個以下の選択肢（サービス名等。1つ以上は使わない紛らわしい選択肢を入れるのが望ましい）、
    `correct` は各プロンプトの正解の `options` 添字（`prompts` と同数）。`why` は `prompts` と同数で、
    使わない選択肢がなぜ当てはまらないかは最後の `why` などに書き添える。`correct` が `[0,1,2,3]` のような
    順番どおりにならないよう、`options` の並びを入れ替えること。
    ```js
    {id:'p4', domain:'aiml', type:'matching', source:SOURCES.xxx, text:'それぞれに最も適したものを選んでください。',
      prompts:['ユースケースA','ユースケースB','ユースケースC'],
      options:['サービスX','サービスY','サービスZ','サービスW'], correct:[2,0,3],
      why:['Aの理由','Bの理由','Cの理由（サービスYは…なので当てはまらない）']},
    ```
  - 形式の配分の目安（`PRACTICE`/`MOCK_POOL` それぞれの累計で）: `single` 約70% ／ `multi` 約15% ／
    `ordering` 約7% ／ `matching` 約8%。`validate_content.py aif-c01` が `types=` で現在の内訳を表示するので、
    少ない形式を優先して補う。
- `single`/`multi` は不正解の選択肢を**隣接・類似する
  AWSサービスや紛らわしい用語**にすること。良い例:
  Bedrock↔SageMaker AI↔SageMaker JumpStart、Comprehend(テキスト分析)↔Textract(文書からの抽出)↔
  Transcribe(音声→テキスト)↔Polly(テキスト→音声)↔Translate、Lex(会話ボット)↔Amazon Q、
  Rekognition(画像/動画)↔Textract、RAG↔ファインチューニング↔継続事前学習↔プロンプトエンジニアリング、
  Guardrails↔Clarify↔Model Monitor↔Model Cards↔A2I、ROUGE↔BLEU↔BERTScore↔精度/F1、
  教師あり↔教師なし↔強化学習、過学習↔学習不足、バッチ推論↔リアルタイム推論↔非同期↔サーバーレス、
  temperature↔top-p↔top-k↔最大トークン数、CloudTrail(API監査)↔CloudWatch(監視)↔Config(構成履歴)、
  Macie(機密データ検出)↔Inspector(脆弱性)↔KMS。
- **正解の選択肢の位置を偏らせないこと**（`single`/`multi`。`validate_content.py` が単一選択の正解位置の
  分布を表示する）。今回追加する項目群の中で正解位置(0,1,2,3)がおおむね均等に
  なるよう、1件ごとに意識的にローテーションする。複数選択の正解の組み合わせ
  （{0,1}{1,2}{2,3}{0,3}{0,2}{1,3}）も固定しない。追加後は既存分を含めた累計の位置分布を数え、
  偏っていれば今回追加分を少ない側に寄せる（選択肢と`why`を一緒に入れ替え、`correct`との対応を崩さない）。
- **選択肢の長さで正解が分からないようにすること。** 正解が最長になる割合は約25%に収める。
  (1) 不正解も正解と同程度の長さ・具体性・文体で書く、(2) 4件に1件程度は不正解のどれかを正解より明確に
  長くする、(3) 補足は選択肢ではなく`why`に書く、(4) サービス名だけの選択肢では全選択肢の形式をそろえる。
  `validate_content.py` が「正解が最長の割合」を表示するので、追加後に確認する（同じ長さも最長扱い。
  5択の`multi`はランダムなら約20〜40%になる。`ordering`/`matching`は対象外）。
- **出典（`source`）を必ず付けること。**
  - 既存の `SOURCES` に適切なものがあれば `source:SOURCES.xxx` で再利用する。
  - なければ、AWS公式ドキュメント（`docs.aws.amazon.com`）または公式ページ（`aws.amazon.com`）を
    WebFetch（失敗時はWebSearch）で確認してから `SOURCES` に新しいキーを追加する。
    **未確認のURLを当て推量で書いてはいけない。** AWS公式ドメイン以外を`source`に書かない
    （第三者の問題集・ブログはヒントとしての参照のみ可）。
  - 一般的なAI/ML用語（過学習、トークン等）は、AWS公式の「What is ...」ページ
    （例: `aws.amazon.com/what-is/...`）や該当サービスのドキュメント内の用語解説を出典にする。
    試験ガイドのドメインページ自体を出典にしてもよいが、内容を説明しているページを優先する。
  - WebFetchが成功したか失敗したかを進捗ログに一言記録する。
- **生成AI分野は変化が速い。学習時点の知識だけで書かず、必ずその場で公式ページを確認すること。**特に:
  - サービス名の変更・統合（例: Amazon SageMaker → **Amazon SageMaker AI**（2024-12改称）、
    QuickSight/Amazon Q系 → ガイドv1.1には **Amazon Quick** と **Amazon Q** が併記されている。
    名称・位置付けは必ず公式ページで確認）。廃止・提供終了済みの機能（例: Bedrock PartyRockなどv1.1で
    例示から外れたもの）を正解にしない。
  - Bedrockで利用可能なモデル・プロバイダーの一覧、価格の具体的な数値、リージョン提供状況は変わりやすいので、
    **特定のモデル名や数値を正解の根拠にする問題は作らない**（概念・機能の問題にする）。
  - Bedrockのカスタマイズ手法（ファインチューニング・継続事前学習・蒸留）の対応モデルや条件は断定しない。
  - 責任共有モデルにおける生成AIの責任範囲、Guardrailsのフィルタ種別などは公式ページで確認してから書く。
  - 確認が取れない事実は、無理に断定的な問題にせず、確実に正しいと分かる内容の問題にすること。
- 試験ガイドの「対象外の職務」（モデルのコーディング、ハイパーパラメータ調整の実施、数理・統計解析など）に
  踏み込んだ問題は作らない。用語・概念・ユースケースに適したサービス選択のレベルにとどめる。
- 用語(`term`)は英語表記、問題文・選択肢・解説は日本語（サービス名・指標名は英語のまま）。

7. 新規項目を書き終えたら、再度 `python3 scripts/validate_content.py aif-c01` を実行し、
   exit code 0（エラーなし）であることを確認する。**エラーが残っている状態でコミットしない。**
   `node` が使える環境なら、次のコマンドで `js/data/aif-c01.js` が実際に読み込めることも確認する
   （件数が表示されればOK）:
   `node -e "const vm=require('vm');const c={window:{}};vm.createContext(c);vm.runInContext(require('fs').readFileSync('js/data/aif-c01.js','utf8'),c);const e=c.window.EXAMS['aif-c01'];console.log(e.VOCAB.length,e.PRACTICE.length,e.MOCK_POOL.length)"`
8. 変更を確認してコミットする。
   - 対象ファイルは `js/data/aif-c01.js`、`content/aif-c01-vocab-list.md`、このファイル（進捗ログ）。
   - コミットメッセージ例: `Add N AIF-C01 content items (vocab a / practice b / mock c)`、
     初回のリスト作成は `Add AIF-C01 vocab list (N terms)`。
   - 末尾に `Co-Authored-By: Claude <noreply@anthropic.com>` を付ける。
9. push前に **もう一度** `git pull --rebase origin master` する。
   - push が non-fast-forward で拒否された場合、1回だけ `git pull --rebase` して再試行する。
   - それでも失敗した場合は `--force` を使わず、変更をコミットしたまま終了する。
10. 最後に、このファイル末尾の「進捗ログ」に追記する（日時・追加件数・累計件数・単語リスト進捗・
    追加トピック・新規SOURCES・WebFetchの成否・見送った用語とその理由）。進捗ログの追記もコミット・pushに含める。

## 禁止事項

- `git push --force` / `git reset --hard` / `--no-verify` は使わない。
- `master`以外のブランチへのpushや、新しいブランチの作成はしない。
- 既存の項目のID・正解・選択肢を書き換えない（明確なバグ修正を除く。修正した場合は進捗ログに明記）。
- `js/data/clf-c02.js`・`CONTENT_GENERATION.md`（CLF-C02用）・`index.html`・`js/app.js`・`css/style.css`・
  `scripts/` 配下は変更しない（構造変更が必要だと感じた場合は、変更せずにこのファイルの末尾に提案を書き残す）。
- 3プールすべてが目標に達している場合、空コミットや無意味な変更を作らない。

## 進捗ログ（この末尾に追記していく）

- 2026-10-19: 初期セットアップ（対話セッションで実施）。`js/data/aif-c01.js` を新設し、試験ガイドv1.1・
  対象サービス・改訂履歴、Bedrock/SageMaker AIの公式ページをWebFetchで確認したうえで種データを投入
  （VOCAB=2, PRACTICE=2, MOCK_POOL=1）。`scripts/validate_content.py` に試験引数（`aif-c01`）と単語リスト
  整合性チェックを追加。単語リスト（`content/aif-c01-vocab-list.md`）は未作成で、次回の定期実行で作成する。
- 2026-10-19: 対話セッションで仕様変更。(1) 想定問題・模擬試験に並び替え(`ordering`)・組み合わせ(`matching`)形式を
  追加し、アプリ（出題・採点・解説表示）と `validate_content.py`（1件ずつ形式別に検証、形式の内訳・単一選択の正解位置分布を
  表示）を対応させた。`multi` は5択を基本に変更。種データとして `p3`（ordering: MLワークフロー、出典 SageMaker AI の
  how-it-works-mlconcepts）と `p4`（matching: Comprehend/Textract/Transcribe/Polly、出典 AWS概要ホワイトペーパーの
  機械学習のページ）を追加（いずれもWebFetchで本文確認）。(2) データファイルを即時関数で囲み
  `window.EXAMS['aif-c01']` に登録する形式に変更（CLF-C02も同様）。進捗は試験ごとに分けて保存。
- 2026-10-18（定期実行）: 試験ガイド改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。ドメイン1〜5ページと対象サービス一覧もWebFetch成功。
  単語リスト `content/aif-c01-vocab-list.md` を新規作成（474語、v1/v2は紐付け済み、他は `未`）。ドメイン別: aiml 135 / genai 81 / fm 97 / responsible 64 / security 97
  （aimlとsecurityが比率より多いので、以降はリスト末尾追記時にgenai/fm/responsibleを優先）。VOCAB/PRACTICE/MOCK_POOL への追加は0件（リスト作成を優先）。累計 VOCAB=2 / PRACTICE=4 / MOCK_POOL=1。新規SOURCESなし。
  注意: リストには廃止・対象外の可能性があるサービス（Amazon Forecast / Fraud Detector / Kendra / Lookout for Metrics / DevOps Guru / CodeGuru / DeepRacer / Kinesis / Athena / GuardDuty / Security Hub / WAF / Audit Manager / Organizations / IAM Identity Center 等、対象サービス一覧に無いもの）を含む。埋める際に公式で確認し、範囲外なら `除外` にすること。
- 2026-10-18（定期実行・2回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リストの行3〜22のうち19語（Bias (Responsible AI)を除く）のVOCABを追加（v3〜v21）。
  累計 VOCAB=21 / PRACTICE=4 / MOCK_POOL=1。単語リスト進捗 21/474。追加トピック: AI/ML/DL/NN/LLM/FM/GenAI、Temperature/Top-p/Top-k/Maximum Tokens、責任あるAI・公平性、責任共有モデル、IAM/IAMロール。
  新規SOURCES: whatIsAi, whatIsGenai, bedrockInference, responsibleAi, sharedResp, whatIsMl, whatIsNn, whatIsLlm, iamRoles（いずれもWebFetch成功。aws.amazon.com/what-is/responsible-ai/ は404のため aws.amazon.com/ai/responsible-ai/ を採用）。
  見送り: 行21「Bias (Responsible AI)」は公式の定義ページを今回確認できず `未` のまま（次回に回す）。正解最長の割合はVOCABで23%に調整済み。PRACTICE/MOCK_POOLは今回追加なし。
- 2026-10-18（定期実行・3回目）: 単語リスト行21,23〜26,28〜34のうち12語のVOCABを追加（v22〜v33）。累計 VOCAB=33 / PRACTICE=4 / MOCK_POOL=1。単語リスト進捗 33/474。
  追加トピック: Bias、Transformer、Stop Sequences、IAM Policy、Training、Token、RAG、Least Privilege、Inference、Training Data、Bedrock Knowledge Bases、Resource-based Policy。
  新規SOURCES: ragAws, bedrockKb, iamPolicies, transformers, aiBias（いずれもWebFetch成功）。改訂履歴ページは今回未確認（最新はv1.1のまま扱った）。
  見送り: 行27 Inclusivity（公式の定義ページ未確認）、行35 Tokenization は次回に回す。正解最長の割合はVOCABで27%に調整済み。PRACTICE/MOCK_POOLは今回追加なし。
- 2026-10-19（定期実行・4回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行37〜40,43〜49,51〜53のうち14語のVOCABを追加（v34〜v47）。累計 VOCAB=47 / PRACTICE=4 / MOCK_POOL=1。単語リスト進捗 47/474。
  追加トピック: Labeled/Unlabeled Data、Supervised/Unsupervised/Reinforcement Learning、Vector Database、Vector、Embedding、AWS KMS、Amazon OpenSearch Service、Amazon Neptune、Encryption at Rest/in Transit、Aurora PostgreSQL pgvector。
  新規SOURCES: vectorDb, embeddings, whatIsRl, kms, opensearch, neptune, mlParadigms, encRestTransit, auroraKb（いずれもWebFetch成功）。
  見送り（`未`のまま次回へ）: 行27 Inclusivity、35 Tokenization、36 Robustness、41 Context Window、42 Safety、50 Veracity、54 Customer Managed Key（公式の定義ページを今回確認できていない）。正解最長の割合はVOCABで29%に調整済み。PRACTICE/MOCK_POOLは今回追加なし。
- 2026-10-19（定期実行・5回目）: 単語リスト行60,61,63,64,66,68,69,70,72,74,75の11語のVOCABを追加（v48〜v58）、PRACTICEを5件追加（p5〜p9: single 3 / matching 2）。累計 VOCAB=58 / PRACTICE=9 / MOCK_POOL=1。単語リスト進捗 58/474。
  追加トピック: Secrets Manager、Macie、PrivateLink、VPC Endpoint、Classification/Regression/Clustering/Dimensionality Reduction/Anomaly Detection（SageMaker AIのアルゴリズム種別ページ）、Diffusion Model、GAN。
  新規SOURCES: secretsManager, macie, privateLink, diffusion, gan（いずれもWebFetch成功。aws.amazon.com/what-is/vpc-endpoint/ は404のため不採用）。改訂履歴ページは今回未確認（v1.1のまま扱った）。
  既存データの修正（明確なバグ）: `js/data/aif-c01.js` で v33 行末と p4 末尾のカンマ漏れによりJavaScriptの構文エラーでファイル全体が読み込めない状態だったため、2か所にカンマを追加（項目の内容は未変更）。`validate_content.py` はこの構文エラーを検出できないので、今後も追加後に必ずnodeでの読み込み確認を行うこと。
  見送り（`未`のまま）: 行62 Hybrid Search、65 Explainability、67 Reranking、71、73 In-context Learning は公式の定義ページを今回確認できていない。MOCK_POOLは今回追加なし。
- 2026-10-19（定期実行・6回目）: 単語リスト行77,97,87,93,96,89,98,92の8語のVOCABを追加（v59〜v66）、PRACTICEを5件（p10〜p14: single 4 / multi 1）、MOCK_POOLを2件（m2,m3）追加。累計 VOCAB=66 / PRACTICE=14 / MOCK_POOL=3。単語リスト進捗 66/474。
  追加トピック: Fine-tuning、Model Distillation、Prompt Engineering（Chain-of-thought）、Computer Vision、NLP、CloudTrail、AWS Config、CloudWatch。
  新規SOURCES: bedrockCustom, promptEng, whatIsCv, whatIsNlp, cloudtrail, awsConfig, cloudwatch（いずれもWebFetch成功）。改訂履歴ページは今回未確認（v1.1のまま扱った）。
  既存データの修正（明確なバグ）: m1 末尾のカンマ漏れ（構文エラー）を修正。nodeでの読み込み確認済み。
  見送り: 行83 Continued Pre-training は Bedrock のカスタマイズ公式ページに記載がなく確認できず `未` のまま。PRACTICE/MOCKは件数が少ないため形式・ドメイン（responsible/fmなど）の補充が次回以降の課題。
- 2026-10-19（定期実行・7回目）: 単語リスト行54,56,42,36,65,57の6語のVOCABを追加（v67〜v72）、PRACTICEを3件（p15〜p17）、MOCK_POOLを2件（m4,m5）追加。累計 VOCAB=72 / PRACTICE=17 / MOCK_POOL=5。単語リスト進捗 72/474。
  追加トピック: Customer Managed Key、責任あるAIの側面（Transparency/Safety/Robustness/Explainability）、Self-supervised Learning。
  新規SOURCES: kmsKeys, whatIsFm（WebFetch成功。責任あるAIの定義は aws.amazon.com/ai/responsible-ai/ を再確認）。改訂履歴ページは今回未確認（v1.1のまま扱った）。nodeでの読み込み確認済み。
  見送り: Multi-modal Model は公式ページに「multimodal」の用語定義が見つからず `未` のまま。MOCK_POOLは件数が少なく正解最長割合(80%)が高いので、次回以降は不正解を長めにして調整すること。
- 2026-10-19（定期実行・8回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行59,62,67,91,94,100の6語のVOCABを追加（v73〜v78）、PRACTICEを7件（p18〜p24: single 4 / multi 1 / ordering 1 / matching 1）、MOCK_POOLを6件（m6〜m11: single 5 / multi 1）追加。累計 VOCAB=78 / PRACTICE=24 / MOCK_POOL=11。単語リスト進捗 78/474。
  追加トピック: Bedrock Knowledge Basesの検索タイプ（Semantic/Hybrid）、Reranking、チャンキング戦略（固定サイズ/デフォルト/階層型/セマンティック）、Transfer Learning、Speech Recognition。
  新規SOURCES: bedrockChunking, bedrockKbQuery, bedrockRerank, transferLearning, speechRecognition（いずれもWebFetch成功）。nodeでの読み込み確認済み。
  見送り: 行35 Tokenization、41 Context Window などは今回も公式の定義ページ未確認のため `未` のまま。MOCK_POOLの正解最長割合は54%まで改善（次回以降も不正解を長めに）。
- 2026-10-19（定期実行・9回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行115,103,108,116の4語のVOCABを追加（v79〜v82）、PRACTICEを6件（p25〜p30: single 3 / multi 1 / ordering 1 / matching 1）、MOCK_POOLを4件（m12〜m15: single 3 / multi 1）追加。累計 VOCAB=82 / PRACTICE=30 / MOCK_POOL=15。単語リスト進捗 82/474（除外1）。
  追加トピック: Bedrock Guardrails（コンテンツ/拒否トピック/単語/機密情報フィルター、グラウンディングチェック、ApplyGuardrail API）、Amazon Inspector、AWS Artifact、RLHF。
  新規SOURCES: guardrails, inspector, artifact, rlhf（いずれもWebFetch成功）。対象サービス一覧もWebFetchで再確認。nodeでの読み込み確認済み。
  除外: 行117 Amazon GuardDuty（対象サービス一覧に無いため）。Trusted Advisor（行113）は一覧に有るが公式ページ未確認のため `未` のまま。
  メモ: MOCK_POOLの正解最長割合が60%と高い（件数が少ないため）。次回以降は不正解を長めにして調整すること。
- 2026-10-19（定期実行・10回目）: 単語リスト行82,85,90,104,261の5語のVOCABを追加（v83〜v87）、PRACTICEを2件（p31,p32: single）、MOCK_POOLを1件（m16: single）追加。累計 VOCAB=87 / PRACTICE=32 / MOCK_POOL=16。単語リスト進捗 87/474（除外1）。追加は件数少なめ（公式ページで確認できる出典が見つかった用語のみ）。
  追加トピック: 時系列データ、構造化/非構造化データ、レコメンデーション、Amazon Personalize。
  新規SOURCES: structuredData, timeSeries, personalize（いずれもWebFetch成功）。改訂履歴ページは今回未確認（v1.1のまま扱った）。nodeでの読み込み確認済み。
  WebFetch失敗（404）: aws.amazon.com/what-is/{recommendation-engine, recommendation-system, text-summarization, semi-supervised-learning, tokenization}。Semi-supervised Learning / Tokenization / Summarization 等は出典未確認のため `未` のまま。
  メモ: VOCABの正解最長割合が41%と高め。次回以降は不正解を長めに書くこと。
- 2026-10-19（定期実行・11回目）: 単語リスト行114,119,120,125,126,113,124,81の8語のVOCABを追加（v88〜v95）、PRACTICEを6件（p33〜p38: single 3 / multi 1 / ordering 1 / matching 1）、MOCK_POOLを4件（m17〜m20: single）追加。累計 VOCAB=95 / PRACTICE=38 / MOCK_POOL=20。単語リスト進捗 95/473（除外1）。
  追加トピック: Feature、Feature Engineering、Label、Hyperparameter（SageMaker AI自動モデルチューニング）、Data Labeling（Ground Truth）、AWS Trusted Advisor、Bedrock Guardrailsコンテンツフィルター、Prompt、Self-refine/Chain-of-thought。
  新規SOURCES: featureEng, dataLabeling, amt, trustedAdvisor, contentFilters（いずれもWebFetch成功）。改訂履歴ページは今回未確認（v1.1のまま扱った）。nodeでの読み込み確認済み。
  既存データの修正: SOURCES末尾（personalize行）のカンマ漏れを追記時に修正（新規追加分と一体の構文修正）。
  WebFetch失敗（404）: aws.amazon.com/what-is/autoencoder/。VAE は出典未確認で `未` のまま。LoRA/PEFTもAWS公式ページがWebSearchで見つからず `未` のまま。
  メモ: 正解最長割合はVOCAB 43% / PRACTICE 39% / MOCK 55%とまだ高め。次回以降は不正解を長めに。
- 2026-10-19（定期実行・12回目）: 単語リスト行133,135,134,130,138,144,153,145,149,154,150,151,146,155の14語のVOCABを追加（v96〜v109）、PRACTICEを4件（p39〜p42: matching 1 / single 2 / multi 1）、MOCK_POOLを3件（m21〜m23: single）追加。累計 VOCAB=109 / PRACTICE=42 / MOCK_POOL=23。単語リスト進捗 109/473（除外1）。
  追加トピック: 過学習/学習不足、ハルシネーション、Guardrailsの各フィルター（拒否トピック/単語/機密情報/グラウンディングチェック）、推論方式（バッチ/リアルタイム/非同期）、Bedrock Provisioned Throughput / Model Invocation Logging / Custom Model Import / Prompt Caching。
  新規SOURCES: underOver, sagemakerDeploy, bedrockBatch, provThroughput, invocationLogging, guardrailsComp, customModelImport, promptCaching, hallucination（いずれもWebFetch成功）。改訂履歴ページは今回未確認（v1.1のまま扱った）。nodeでの読み込み確認済み。
  見送り: 行136 Amazon Bedrock Agents / 141 Action Group は、公式ドキュメントに「Bedrock Agents（Classic）は新規顧客の受付を終了、AgentCore を推奨」とあり、試験ガイドv1.1での位置付け確認が必要なため `未` のまま（次回に確認）。
  メモ: 正解最長割合が VOCAB 43% / PRACTICE 45% / MOCK 56% と高い。次回以降は不正解の選択肢を正解より長く書くこと。
- 2026-10-19（定期実行・7回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リストのうち公式ページで確認できた10語のVOCABを追加（v110〜v119）、PRACTICEを5件（p43〜p47: ordering 1 / matching 1 / single 2 / multi 1）、MOCK_POOLを5件（m24〜m28: matching 1 / ordering 1 / single 3）追加。累計 VOCAB=119 / PRACTICE=47 / MOCK_POOL=28。単語リスト進捗 119/473（除外1）。
  追加トピック: Bedrock Agents、Hyperparameter Tuning、AgentCore（Identity含む）、Prompt Management、Bedrock Model Evaluation、SageMaker Clarify、Model Cards、JumpStart、Strands Agents。
  新規SOURCES: bedrockAgents, agentcore, promptMgmt, bedrockEval, clarify, modelCards, jumpstart, strands（いずれもWebFetch成功）。
  注意: Bedrock Agents（Classic）とSageMaker Clarifyは公式ドキュメント上「新規顧客の受け付け終了」の注記あり。Bedrock Agentsは新規はAgentCore推奨。問題は概念説明にとどめた。
  見送り（`未`のまま）: 従来どおり定義ページ未確認の行（Inclusivity、Tokenization等）。リスト順ではなく、確認できた用語を優先した。nodeでの読み込み確認済み。
- 2026-10-19（定期実行・8回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。対象サービス一覧もWebFetchで再確認。単語リストのVOCABを12語追加（v120〜v131: Serverless Inference、Automated Reasoning Checks、AWS Glue Data Catalog、Action Group、Policy in AgentCore、Amazon Comprehend/Lex/Polly/Rekognition/Textract/Transcribe/Translate）、PRACTICEを4件（p48〜p51: single 3 / matching 1）、MOCK_POOLを3件（m29〜m31: single）追加。累計 VOCAB=131 / PRACTICE=51 / MOCK_POOL=31。単語リスト進捗 131/469（除外5）。
  新規SOURCES: serverlessInf, automatedReasoning, glueCatalog, actionGroup, agentcorePolicy, comprehend, lex, polly, rekognition, textract, transcribe, translate（いずれもWebFetch成功。agentcorePolicyはWebSearchで見つけた docs.aws.amazon.com/bedrock-agentcore/.../policy.md をWebFetchで本文確認）。nodeでの読み込み確認済み。
  除外: 行122 AWS Security Hub / 127 AWS WAF / 132 AWS Audit Manager（対象サービス一覧に無いため）、315 Amazon SageMaker Serverless Inference（行157 Serverless Inferenceと重複）。
  メモ: VOCABの正解最長割合が46%と高いまま（既存分の影響大）。次回以降は不正解を正解より長く書くこと。Bedrock Agents（Classic）は新規受付終了の注記があるため、Action Groupの問題は概念説明にとどめた。
- 2026-10-19（定期実行・9回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行164,169,156,152,175,185,73,194,274,275,269の11語のVOCABを追加（v132〜v142）、PRACTICEを6件（p52〜p57: single 4 / multi 1 / ordering 1）、MOCK_POOLを4件（m32〜m35: single 3 / multi 1）追加。累計 VOCAB=142 / PRACTICE=57 / MOCK_POOL=35。単語リスト進捗 142/469（除外5）。
  追加トピック: Bedrockのトークン課金（入力/出力トークン、バッチモード、Provisioned Throughput）、ML Lineage Tracking、事前学習、zero-shot/few-shot/in-context learning、プロンプトテンプレート、SageMaker Feature Store（オンライン/オフライン）、Model Monitor、Data Wrangler。
  新規SOURCES: bedrockPricing, lineage, promptGuide, featureStore, modelMonitor, dataWrangler（いずれもWebFetch成功）。nodeでの読み込み確認済み。
  注意: Model Monitorは新規顧客の受け付け終了、Data WranglerはSageMaker Canvasに統合済みの注記があり、解説に反映した。
  WebFetch失敗（404）: aws.amazon.com/what-is/{fraud-detection, data-preprocessing, exploratory-data-analysis}。Fraud Detection / EDA / Data Pre-processing は出典未確認のため `未` のまま。SCP（行142）はAWS Organizationsが対象サービス一覧に無いため見送り。
  メモ: 正解最長割合は VOCAB 49% / PRACTICE 40% / MOCK 51% と高いまま。次回以降は不正解を正解より長く書くこと。
- 2026-10-20（定期実行）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行173,178,172,188,184,213,280,284,252,260,193,206の12語のVOCABを追加（v143〜v154）、PRACTICEを4件（p58〜p61: single 2 / matching 1 / ordering 1）、MOCK_POOLを3件（m36〜m38: single 2 / multi 1）追加。累計 VOCAB=154 / PRACTICE=61 / MOCK_POOL=38。単語リスト進捗 154/469（除外5）。
  追加トピック: 分類指標（Precision/Recall/Accuracy/Confusion Matrix/AUC）、SageMaker Model Registry・Pipelines・Ground Truth、Amazon Q Developer/Q Business、Agentic AI・マルチエージェント、Bedrock LLM-as-a-judgeの組み込みメトリクス（Faithfulness/Stereotyping）。
  新規SOURCES: binaryInsights, modelRegistry, sagemakerPipelines, groundTruth, qDeveloper, qBusiness, agenticAi, judgeMetrics（いずれもWebFetch成功。binaryInsightsは旧Amazon Machine Learningのドキュメントだが指標の定義が公式に記載されている）。
  注意: Ground Truth・Q Businessは新規顧客の受け付け終了、Q DeveloperのIDEプラグインは2027-04-30にサポート終了（Kiro案内）の注記があり、解説に反映した。
  WebFetch失敗（404）: aws.amazon.com/what-is/mcp/。Kiroは公式AWSドメインの定義ページを確認できず見送り。MCP・Context Window・Tokenization等は `未` のまま。
  メモ: 正解最長割合は VOCAB 52% / PRACTICE 38% / MOCK 52% と高いまま。次回以降は不正解を正解より長く書くこと。
- 2026-10-20（定期実行・2回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行41,50,95,101,211の5語＋末尾追記の行475 Controllabilityの計6語のVOCABを追加（v155〜v160）、PRACTICEを5件（p62〜p66: matching 1 / single 3 / multi 1）、MOCK_POOLを5件（m39〜m43: single 4 / multi 1）追加。累計 VOCAB=160 / PRACTICE=66 / MOCK_POOL=43。単語リスト進捗 160/470（除外5）。
  追加トピック: 責任あるAIの8側面（Veracity and robustness / Privacy and security / Governance / Controllability / Transparency 等）、Context Window、Model Context Protocol (MCP)、Bedrockの用語（Orchestration）。
  新規SOURCES: mcpWhat（docs.aws.amazon.com/prescriptive-guidance/.../what-is-mcp.html）、bedrockTerms（Bedrock key-definitions）（いずれもWebFetch成功。責任あるAIの定義は aws.amazon.com/ai/responsible-ai/ を再確認）。nodeでの読み込み確認済み。
  見送り: Tokenization（Bedrockの用語集にはTokenの定義のみで専用ページなし）、Context Engineering は公式の定義ページ未確認のため `未` のまま。Accountabilityは責任あるAIの8側面に含まれず未確認。
  メモ: 正解最長割合は VOCAB 53% / PRACTICE 41% / MOCK 48% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・3回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行88,102,167,80,118,105,99,111の8語のVOCABを追加（v161〜v168）、PRACTICEを6件（p67〜p72: single 5 / multi 1）、MOCK_POOLを4件（m44〜m47: matching 1 / single 2 / multi 1）追加。累計 VOCAB=168 / PRACTICE=72 / MOCK_POOL=47。単語リスト進捗 168/470（除外5）。
  追加トピック: Instruction tuning、Domain adaptation、データ分割（学習/検証/テスト）とデータリーク、表形式データ、生成AIの用途（コード生成・要約・文章生成・画像生成）、Bedrockのカスタマイズ手法の組み合わせ、Macie。
  新規SOURCES: instrFt, domainAdapt, splitsLeakage, tabularAlgos（いずれもWebFetch成功）。生成AIの用途は既存 whatIsGenai を再確認。nodeでの読み込み確認済み。
  見送り: Continued Pre-training は Bedrock カスタマイズ公式ページ（custom-models.html）に記載がなく `未` のまま。LoRA/PEFT/Bias・Variance はAWS公式ページがWebSearchで見つからず `未` のまま。
  メモ: 正解最長割合は VOCAB 54% / PRACTICE 42% / MOCK 50% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・4回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行55,58,177,190,201の5語のVOCABを追加（v169〜v173）、PRACTICEを5件（p73〜p77: single 4 / multi 1）、MOCK_POOLを4件（m48〜m51: ordering 1 / matching 1 / single 2）追加。累計 VOCAB=173 / PRACTICE=77 / MOCK_POOL=51。単語リスト進捗 173/470（除外5）。
  追加トピック: 半教師あり学習、マルチモーダル（Titan Multimodal Embeddings G1）、Provisioned Throughput（Model Unit・コミットメント）、Chain-of-thought、AIエージェント、Guardrailsのフィルター（contextual grounding / denied topics / word / sensitive info / content）。
  新規SOURCES: supervisedLearning, titanMultimodalEmb（いずれもWebFetch成功。既存の promptEng / provThroughput / agenticAi / guardrails も本文を再確認）。nodeでの読み込み確認済み。
  WebFetch失敗（404）: aws.amazon.com/what-is/multimodal-ai/, aws.amazon.com/what-is/autoencoder/。VAE（行76）はAWS公式の出典が見つからず `未` のまま。今回は件数が目安（15〜25）に届かず9件にとどまった（出典確認が取れた項目のみ追加）。promptEng には zero-shot/few-shot/prompt chaining の記載がなく、Single-shot / Prompt Chaining は `未` のまま。
  メモ: 正解最長割合は VOCAB 54% / PRACTICE 44% / MOCK 47% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・5回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行198,129,181,191の4語のVOCABを追加（v174〜v177）、PRACTICEを4件（p78〜p81: single）、MOCK_POOLを3件（m52〜m54: single）追加。累計 VOCAB=177 / PRACTICE=81 / MOCK_POOL=54。単語リスト進捗 177/470（除外5）。件数は目安（15〜25）に届かず11件（出典確認が取れた項目のみ）。
  追加トピック: MLOps、機械翻訳（Amazon Translate）、F1スコア、PII（Comprehend）。
  新規SOURCES: mlops, machineTranslation（WebFetch成功）、comprehendF1, piiComprehend（WebSearchで docs.aws.amazon.com の該当ページを確認。WebFetchは未実施）。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 46% / MOCK 46% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・6回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。対象サービス一覧はWebFetchで再確認。単語リスト行170,186,339,328,313,162の6語のVOCABを追加（v178〜v183）、PRACTICEを5件（p82〜p86: single 3 / matching 1 / multi 1）、MOCK_POOLを4件（m55〜m58: single 3 / multi 1）追加。累計 VOCAB=183 / PRACTICE=86 / MOCK_POOL=58。単語リスト進捗 183/470（除外8）。
  追加トピック: Negative Prompt（Nova Canvas）、Comprehend PII墨消し（MaskMode/MaskCharacter/PiiEntityTypes）、Lake Formation（きめ細かなアクセス制御・CloudTrail監査）、Glue DataBrew、Amazon Nova、データカタログ、責任あるAIの8側面（responsibleAiを再確認）、SageMaker Clarifyの説明可能性（SHAP）。
  新規SOURCES: clarifyExplain, novaImagePrompt, comprehendRedaction, lakeFormation, databrew, nova（いずれもWebFetch成功）。nodeでの読み込み確認済み。
  除外: 行137 AWS Organizations / 142 SCP / 147 IAM Identity Center（対象サービス一覧に無いため）。
  見送り: Interpretability / Accountability / Environmental Sustainability などは公式の定義ページ未確認のため `未` のまま（Accountability・Interpretabilityはresponsible-aiページに記載なし）。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 46% / MOCK 43% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・7回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行196,209,224,208,202の5語のVOCABを追加（v184〜v188）、PRACTICEを5件（p87〜p91: single 3 / multi 1 / matching 1）、MOCK_POOLを4件（m59〜m62: single 3 / ordering 1）追加。累計 VOCAB=188 / PRACTICE=91 / MOCK_POOL=62。単語リスト進捗 188/467（除外8）。件数は目安に届かず14件（出典を本文で確認できた用語のみ）。
  追加トピック: MSE（回帰指標）、プロンプトインジェクション/ジェイルブレイク/プロンプトリーケージ（Guardrailsのプロンプト攻撃フィルターと入力タグ）、データドリフト、Model Monitorの監視の種類とワークフロー、Precision（誤検知コストが高い場合）。
  新規SOURCES: promptAttack, canvasMetrics（いずれもWebFetch成功。modelMonitorも本文を再確認し、新規顧客の受け付け終了の注記あり）。nodeでの読み込み確認済み。
  見送り: ROC Curve は取得した公式ページにAUCの記載のみでROC曲線の定義が無く `未` のまま。
  メモ: 正解最長割合は VOCAB 54% / PRACTICE 43% / MOCK 46% と高いまま（既存分の影響大）。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・8回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行106,110,160,163,171の5語のVOCABを追加（v189〜v193）、PRACTICEを4件（p92〜p95: single 2 / multi 1 / matching 1）、MOCK_POOLを4件（m63〜m66: single）追加。累計 VOCAB=193 / PRACTICE=95 / MOCK_POOL=66。単語リスト進捗 193/467（除外8）。件数は目安に届かず13件（出典を本文で確認できた用語のみ）。
  追加トピック: Fraud Detection（Amazon Fraud Detector）、Forecasting（Amazon Forecast）、EDA、Data Pre-processing（Data Wrangler）、Data Quality Assessment（Data Quality and Insights Report）、ターゲットリーク。いずれも Fraud Detector / Forecast は新規顧客受け付け終了の注記を解説に明記。
  新規SOURCES: dataWrangler, dataInsights, fraudDetector, forecast（いずれもWebFetch成功）。
  WebFetch失敗/情報不足: aws.amazon.com/what-is/data-preprocessing/ と data-anonymization/（404）、Bedrock pricingページにOn-Demandの定義なし → On-Demand Throughput / Data Anonymization は `未` のまま。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 41% / MOCK 48% と高いまま。次回以降も不正解を正解より長く書くこと。
  注意: 初回pushでSOURCESの直前行のカンマ欠落による構文エラーがあり、直後に修正pushした（nodeでの読み込み確認済み）。
- 2026-10-20（定期実行・9回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行262 ROUGE・265 Amazon Quick の2語のVOCABを追加（v194,v195）、PRACTICEを2件（p96,p97: single）、MOCK_POOLを2件（m67,m68: single）追加。累計 VOCAB=195 / PRACTICE=97 / MOCK_POOL=68。単語リスト進捗 195/466（除外9）。件数は目安に届かず6件（出典を本文で確認できた用語のみ）。
  追加トピック: ROUGE（rouge1/rouge2/rougeL、SummarizationAccuracyの指標=ROUGE-N/Meteor/BERTScore）、BERTScore、Amazon Quick。
  新規SOURCES: fmevalAuto, quickWhat（WebFetch成功）、qBizWhat（WebFetch成功。ただしQ Business項目は既存の重複のため未使用）。nodeでの読み込み確認済み。
  除外: 行246 Amazon Q（既存の Amazon Q Business 項目と重複のため）。
  見送り: BLEU（行267）は取得した公式ページにBLEUの記載がなく `未` のまま。Bedrock Prompt Optimization はWebFetchで本文が取得できず `未` のまま。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 40% / MOCK 46% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・10回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行228 Prompt Leaking のVOCABを追加（v196）、PRACTICEを2件（p98: single / p99: matching）、MOCK_POOLを1件（m69: single）追加。累計 VOCAB=196 / PRACTICE=99 / MOCK_POOL=69。単語リスト進捗 196/466（除外9）。件数は目安に届かず4件（出典を本文で確認できた項目のみ）。
  追加トピック: プロンプトリーケージ/ジェイルブレイク/プロンプトインジェクションの区別、Guardrailsの入力タグ。新規SOURCESなし（promptAttackをWebFetchで本文再確認。Prompt Leakageは「Standard tierのみ」の記載あり）。nodeでの読み込み確認済み。
  見送り: Prompt Hijacking（goal hijackingの記載のみで定義が弱い）、ReAct / Prompt Chaining / Single-shot（promptEng・promptGuideのページに記載なし）は `未` のまま。
- 2026-10-20（定期実行・11回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行222 Tool Use (Agents) のVOCABを追加（v197）、PRACTICEを1件（p100: single）、MOCK_POOLを1件（m70: single）追加。累計 VOCAB=197 / PRACTICE=100 / MOCK_POOL=70。単語リスト進捗 197/466（除外9）。件数は目安に届かず3件（出典を本文で確認できた項目のみ）。
  追加トピック: Bedrockのツール使用（クライアント側/サーバー側モード）。新規SOURCES: toolUse（docs.aws.amazon.com/bedrock/.../tool-use.html、WebFetch成功）。nodeでの読み込み確認済み。
  WebFetch失敗/情報不足: SageMaker Clarifyの clarify-bias-metric-cddl.html は本文が取得できず（Demographic Parity等は `未` のまま）。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 41% / MOCK 48% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-20（定期実行・12回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。VOCABの追加なし、PRACTICEを3件（p101〜p103: single）、MOCK_POOLを2件（m71,m72: single）追加。累計 VOCAB=197 / PRACTICE=103 / MOCK_POOL=72。単語リスト進捗 197/466（除外9）。件数は目安に届かず5件（出典を本文で確認できた項目のみ）。
  追加トピック: 過学習/学習不足への対応（正則化・特徴量・柔軟性）、SageMaker Clarifyの説明可能性（SHAP・PDP）。新規SOURCESなし（underOver / clarifyExplain をWebFetchで本文再確認。ClarifyとAmazon Machine Learningは新規顧客受け付け終了の注記あり）。nodeでの読み込み確認済み。
  見送り: Bias (ML) / Variance は underOver ページにbias・varianceの定義記載がなく `未` のまま。
- 2026-10-21（定期実行）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行238 Prompt Versioning のVOCABを追加（v198）、PRACTICEを1件（p104: multi、ハルシネーション低減策）、MOCK_POOLを1件（m73: single、プロンプトバリアント）追加。累計 VOCAB=198 / PRACTICE=104 / MOCK_POOL=73。単語リスト進捗 198/466（除外9）。件数は目安に届かず3件（出典を本文で確認できた項目のみ）。
  新規SOURCESなし（promptMgmt と hallucination を WebFetch で本文再確認、成功）。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 55% / PRACTICE 43% / MOCK 46% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・2回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行217,239,215,216の4語のVOCABを追加（v199〜v202）、PRACTICEを5件（p105〜p109: single 3 / ordering 1 / matching 1）、MOCK_POOLを4件（m74〜m77: single）追加。累計 VOCAB=202 / PRACTICE=109 / MOCK_POOL=77。単語リスト進捗 202/466（除外9）。件数は目安に届かず13件（出典を本文で確認できた項目のみ）。
  追加トピック: AgentCore Memory（短期/長期メモリ）、RetrieveAndGenerateの引用（citations）とGuardrailsの適用範囲、モデル呼び出しログ（監査証跡）、MLパイプラインの段階。
  新規SOURCES: agentcoreMemory, kbRetrieveGenerate（WebFetch成功）。invocationLogging / mlops も本文を再確認（成功）。hallucination ページには grounding・confidence scoring の記載がなく、Grounding Techniques / Hallucination Detection / Confidence Scoring は `未` のまま。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 56% / PRACTICE 44% / MOCK 45% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・3回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。VOCABの追加なし、PRACTICEを8件（p110〜p117: single 5 / matching 1 / multi 1 ほか）、MOCK_POOLを6件（m78〜m83: single 5 / multi 1）追加。累計 VOCAB=202 / PRACTICE=117 / MOCK_POOL=83。単語リスト進捗 202/466（除外9）。件数は目安に届かず14件（出典を本文で確認できた項目のみ）。
  追加トピック: 責任あるAIの8側面（responsibleAi をWebFetchで本文再確認）、Bedrockのカスタマイズ手法（教師ありファインチューニング／強化ファインチューニング／蒸留。bedrockCustom をWebFetchで再確認し、「Continued Pre-training」は同ページに記載がないため `未` のまま）、基盤モデルと従来MLの違い（whatIsGenai 再確認）。新規SOURCESなし。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 56% / PRACTICE 45% / MOCK 45% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・4回目）: 改訂履歴をWebFetchで確認（最新は引き続きv1.1、2026-04-30）。単語リスト行35,205,210の3語のVOCABを追加（v203〜v205）、PRACTICEを6件（p118〜p123: single 2 / multi 1 / ordering 1 / matching 1 ほか）、MOCK_POOLを6件（m84〜m89: single）追加。累計 VOCAB=205 / PRACTICE=123 / MOCK_POOL=89。単語リスト進捗 205/466（除外9）。
  追加トピック: トークン、Guardrailsの出力フィルタリング/機密情報フィルター/単語フィルター/拒否トピック/コンテキストグラウンディング、RAGの流れ、埋め込み、モデルカスタマイズ、推論パラメータとハイパーパラメータ。
  新規SOURCESなし（bedrockTerms と guardrails を WebFetch で本文再確認、成功）。
  見送り: Context Engineering は公式ドキュメントが検索で見つからず `未` のまま。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 45% / MOCK 45% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・5回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。VOCABの追加なし、PRACTICEを7件（p124〜p130: single 5 / multi 1 / matching 1）、MOCK_POOLを7件（m90〜m96: single 6 / ordering 1）追加。累計 VOCAB=205 / PRACTICE=130 / MOCK_POOL=96。単語リスト進捗 205/466（除外9）。計14件。
  追加トピック: Provisioned Throughput（カスタムモデルの利用条件・コミットメント期間・時間課金・手順）、バッチ推論（S3入出力・プロビジョンドモデル非対応）、KBのチャンキング方式（デフォルト/階層型/セマンティック/なし）、Model Cards（用途・リスク評価）、Macie。
  新規SOURCESなし（provThroughput / bedrockBatch / bedrockChunking / modelCards / macie をWebFetchで本文再確認、すべて成功）。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 47% / MOCK 43% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・6回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行411 SHAP Values＋末尾追記の行476 Prompt Leakageの2語のVOCABを追加（v206,v207）、PRACTICEを6件（p131〜p136: single 4 / multi 1 / matching 1）、MOCK_POOLを6件（m97〜m102: single）追加。累計 VOCAB=207 / PRACTICE=136 / MOCK_POOL=102。単語リスト進捗 207/467（除外9）。計14件。
  追加トピック: Guardrailsのプロンプト攻撃フィルター（ジェイルブレイク/プロンプトインジェクション/プロンプトリーケージ、入力タグ、toolResult非対象、Detectアクション）、SageMaker ClarifyのSHAP、Bedrock評価ジョブの種類。
  新規SOURCESなし（promptAttack / clarifyExplain / bedrockEval をWebFetchで本文再確認、すべて成功）。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 47% / MOCK 45% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・7回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行76 Variational Autoencoder (VAE) のVOCABを追加（v208）、PRACTICEを3件（p137〜p139: single 2 / matching 1）、MOCK_POOLを2件（m103,m104: single）追加。累計 VOCAB=208 / PRACTICE=139 / MOCK_POOL=104。単語リスト進捗 208/467（除外9）。計6件（出典を本文で確認できた項目のみ）。
  追加トピック: VAEのエンコーダー/デコーダー/潜在空間（whatIsGenai をWebFetch成功で本文確認）、責任あるAIの8側面の定義（responsibleAi をWebFetch成功で再確認）。新規SOURCESなし。
  見送り: Inclusivity / Accountability / Trustworthiness は responsibleAi ページに定義の記載がなく `未` のまま。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 48% / MOCK 44% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・8回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。PRACTICEを5件（p140〜p144: single 4 / multi 1）、MOCK_POOLを3件（m105〜m107: single）追加。VOCAB追加なし。累計 VOCAB=208 / PRACTICE=144 / MOCK_POOL=107。単語リスト進捗 208/467（除外9）。計8件。
  追加トピック: Bedrockのカスタマイズ手法（教師ありFT・強化FT・蒸留、トレーニング課金はトークン数×エポック数）、SageMaker JumpStartのドメイン適応FT。出典は bedrockCustom / domainAdapt をWebFetch成功で本文確認。新規SOURCESなし。
  見送り: 行83 Continued Pre-training は、Bedrockのカスタマイズ手法ページ（現行）に継続事前学習の記載が無く、公式の定義ページを確認できないため `未` のまま（次回以降に再確認、確認できなければ `除外`）。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 47% / MOCK 44% と高いまま。今回の追加分は不正解を長めに書いて調整。
- 2026-10-21（定期実行・9回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行192 ROC Curve のVOCABを追加（v209）、PRACTICEを5件（p145〜p149: single 4 / multi 1）、MOCK_POOLを3件（m108〜m110: single）追加。累計 VOCAB=209 / PRACTICE=149 / MOCK_POOL=110。単語リストは209/467（除外9）。
  追加トピック: AUC/ROC、カットオフのトレードオフ、過学習/過小適合の対処、フューショットプロンプティング。出典は binaryInsights / underOver / promptGuide をWebFetch成功で本文再確認。新規SOURCESなし。
  見送り: Bias (ML) / Variance は underOver ページに記載がなく、Single-shot Prompting も promptGuide に定義がない（zero-shot/few-shotのみ）ため `未` のまま。On-Demand Throughput も prov-throughput ページに定義記載なし。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 47% / MOCK 43% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・10回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行316,334,342,348,320のVOCABを追加（v210〜v214）、PRACTICEを8件（p150〜p157: single 5 / multi 1 / ordering 1 / matching 1）、MOCK_POOLを5件（m111〜m115: single）追加。累計 VOCAB=214 / PRACTICE=157 / MOCK_POOL=115。単語リストは214/467（除外9）。
  追加トピック: Converse API/InvokeModel、Bedrock Flows（作成→テスト→バージョン→エイリアス）、Playground、クロスリージョン推論（Geographic/Global）、LLM-as-a-judgeの組み込みメトリクス、責任あるAIの8次元、AIバイアスの種類（測定/選択/アルゴリズム）。
  新規SOURCES: converseApi, crossRegion, bedrockFlows（いずれもWebFetch成功）。responsibleAi / aiBias / bedrockTerms / judgeMetrics / promptGuide も本文を再確認（WebFetch成功）。nodeでの読み込み確認済み。
  見送り: Accountability / Inclusivity は responsible-ai ページに定義がなく、Bias(ML)/Variance も ai-bias ページに記載がないため `未` のまま。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 48% / MOCK 41% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・11回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行161 Instruction・165 Context (Prompt) のVOCABを追加（v215,v216）、PRACTICEを8件（p158〜p165: single 5 / multi 1 / matching 1 / single 1）、MOCK_POOLを5件（m116〜m120: single）追加。累計 VOCAB=216 / PRACTICE=165 / MOCK_POOL=120。単語リストは216/467（除外9）。
  追加トピック: プロンプトの構成要素（指示/コンテキスト/入力/デモンストレーション例）、プロンプトテンプレート、Bedrockモデルは過去のやり取りを記憶しない、Guardrailsのプロンプト攻撃フィルター（Jailbreak/Prompt Injection/Prompt Leakage、InvokeModelでの入力タグ必須、toolResultは評価対象外、LeakageはStandardティアのみ）。
  新規SOURCESなし。promptAttack / promptGuide の本文をWebFetchで再確認（成功）。nodeでの読み込み確認済み。WebFetch: aws.amazon.com/what-is/prompt-engineering/ にはReAct・プロンプトチェーンの記載なし → ReAct/Prompt Chaining は `未` のまま。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 46% / MOCK 40% と高いまま。次回以降も不正解を正解より長く書くこと。
- 2026-10-21（定期実行・12回目）: 改訂履歴ページは今回未確認（v1.1のまま扱った）。単語リスト行220 Hallucination Detection・225 Grounding Techniques のVOCABを追加（v217,v218）、PRACTICEを7件（p166〜p172: single 5 / multi 1 / matching 1）、MOCK_POOLを5件（m121〜m125: single）追加。累計 VOCAB=218 / PRACTICE=172 / MOCK_POOL=125。単語リストは218/467（除外9）。計14件。
  追加トピック: Bedrock Guardrailsのcontextual grounding check（grounding/relevance、しきい値0〜0.99、出力のみ評価、ApplyGuardrailの追加コンテンツブロック、Converseのgrounding_source qualifier）、RAG・具体的なプロンプトによるハルシネーション低減。
  新規SOURCES: contextualGrounding（WebFetch成功・本文確認）。hallucination も本文を再確認（WebFetch成功）。nodeでの読み込み確認済み。
  メモ: 正解最長割合は VOCAB 57% / PRACTICE 47% / MOCK 40% と高いまま。次回以降も不正解を正解より長く書くこと。
