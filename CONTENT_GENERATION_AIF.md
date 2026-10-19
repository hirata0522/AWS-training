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
