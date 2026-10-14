# CLF-C02コンテンツ生成ランブック（定期実行エージェント用）

このファイルは、`js/data/clf-c02.js` のコンテンツ（単語・想定問題・模擬試験プール）を
目標件数まで段階的に増やすための手順書。定期実行のクラウドエージェント（ルーティン）が
**毎回ゼロから**このファイルを読んで作業する前提で書かれている。会話の記憶は引き継がれない。

## 目標

| プール | ファイル内の変数 | 現在 | 目標 |
|---|---|---|---|
| 単語問題 | `VOCAB` | `scripts/validate_content.py` 実行結果を参照 | 500 |
| 想定問題（カジュアル） | `PRACTICE` | 同上 | 1500 |
| 模擬試験専用プール | `MOCK_POOL` | 同上 | 500 |

3プールとも **CLF-C02試験ガイドのドメイン配分**に沿わせる：
クラウドのコンセプト(`concepts`)26% ／ セキュリティとコンプライアンス(`security`)25% ／
クラウドテクノロジーとサービス(`tech`)33% ／ 請求・課金・サポート(`billing`)16%。
出典: https://docs.aws.amazon.com/pdfs/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.pdf

## 1回の実行手順

0. **作業前に必ず** `git branch --show-current` 等で現在のブランチを確認し、`master` でなければ
   `git checkout master` してから `git pull --rebase origin master` を実行し、最新状態から始めること。
   **新しいブランチを作らない。** 変更は必ず`master`に直接コミット・pushする（PRは作らない）。
   （過去に、サンドボックスが起動時に`master`以外のブランチをチェックアウトした状態になっており、
   それに気づかず作業してしまったため、20回分の内容が別ブランチに孤立し続けた事故があった。
   このステップを省略しないこと。）
1. `python3 scripts/validate_content.py` を実行し、現在の件数（プール別・ドメイン別）を確認する。
   - このスクリプトが失敗（exit code != 0）する場合、既存データが壊れている。新規追加は行わず、
     まずそのエラーを報告すること（直せる範囲なら直してよいが、無理に推測で直さない）。
2. 3プールすべてが目標件数に達していたら、**何もせず終了**する（コミットしない）。
3. 今回追加する件数の予算を決める（目安: 合計15〜25件程度。ユーザーから別途指示があればそれに従う）。
   - 各プールの残り件数（目標-現在、0未満は0）に比例して予算を配分する。
   - 各プール内では、現在のドメイン別件数が目標比率（26/25/33/16）からどれだけ離れているかを見て、
     不足しているドメインを優先的に補う。
4. 新規項目を作成する。**既存の項目は絶対に変更・削除しない**。IDは各プールの現在の最大値+1から
   連番で振る（`VOCAB`は`v`、`PRACTICE`は`p`、`MOCK_POOL`は`m`、例: `v301`, `p842`, `m177`）。

### 項目の作り方（必読・精度に関する重要ルール）

- データ構造は既存の項目をそのまま真似ること（`VOCAB`はネストした`q:{...}`、`PRACTICE`/`MOCK_POOL`は
  フラットな構造。`correct`は`VOCAB`では整数、`PRACTICE`/`MOCK_POOL`では配列）。
- 各項目は選択肢4つ・解説（`why`）4つを必ずセットで用意し、不正解の選択肢は**隣接・類似する
  AWSサービスや紛らわしい用語**にすること（当てずっぽうで消去法が効かないように）。
  良い例: EBS(ブロック)↔S3(オブジェクト)↔EFS(ファイル)、CloudWatch(メトリクス監視)↔CloudTrail(API監査)、
  AWS WAF(アプリ層フィルタ)↔AWS Shield(DDoS対策)、セキュリティグループ(インスタンス単位/ステートフル)↔
  NACL(サブネット単位/ステートレス)、Direct Connect(専用線)↔Site-to-Site VPN(インターネット経由)、
  リザーブドインスタンス↔Savings Plans↔スポットインスタンス↔オンデマンド。
- **正解の選択肢の位置を偏らせないこと。** これまでの失敗: 正解をいつも1番目(index 0)に置いてしまい、
  パターンで答えが分かってしまう不具合が過去にあった。今回追加する項目群の中で、正解位置
  (0,1,2,3)がおおむね均等になるよう、1件ごとに意識的にローテーションすること
  （例: 1件目は位置0、2件目は位置1、3件目は位置2、4件目は位置3、5件目は位置0...）。
  複数選択（`type:'multi'`、`correct`が2件）の場合も、正解の2つの組み合わせ
  （{0,1}{1,2}{2,3}{0,3}{0,2}{1,3}）を一つの組み合わせに固定せず変えること。
- **出典（`source`）を必ず付けること。**
  - 既存の `SOURCES` オブジェクトに適切なものがあれば `source:SOURCES.xxx` で再利用する。
  - 適切なものがなければ、AWS公式ドキュメント（`docs.aws.amazon.com`）または
    公式サービスページ（`aws.amazon.com/<service>/`）をWebSearch/WebFetchで確認してから、
    `SOURCES` オブジェクトに新しいキーを追加する。**未確認のURLを当て推量で書いてはいけない。**
  - 出典として使ってよいのはAWS公式ドメインのみ。第三者の問題集サイト・ブログ・まとめ記事を
    出典として書かない（内容のヒントとして参考にするのは構わないが、`source`には使わない）。
  - **WebFetchについての注意**: 下の「進捗ログ」には、過去の実行で`docs.aws.amazon.com`/`aws.amazon.com`への
    `WebFetch`がDNS/プロキシでブロックされたという記録が複数残っているが、**それを理由に今回の実行で
    WebFetchを試すこと自体を省略してはいけない**。環境のネットワーク設定は変更される可能性があるため、
    **この実行では最初に出典確認を行う際、新規に追加するSOURCESのうち少なくとも1件で実際にWebFetchを
    試し**、成功した場合はそのまま本文を直接確認する方法に切り替えてよい。失敗した場合はWebSearchの
    検索結果スニペットで内容を確認するフォールバックを使い、作業は中断しない。どちらの結果だったかを
    進捗ログに一言記録すること（例:「WebFetchは今回成功した／今回も失敗した」）。
- **特に間違えやすい/変化しやすい事実は、必ずその場でWeb検索・公式ページ確認を行うこと**
  （学習時点の知識だけで書かない）。例:
  - ストレージの種別（S3=オブジェクト、EBS=ブロック、EFS=ファイル）を混同しない。
    過去に「S3はブロックストレージ」という誤りがあったことがある。致命的なミスなので要注意。
  - AWS Free Tierの現行の構成（常時無料サービス／新規アカウント向け無料クレジット／短期トライアルの
    3区分。「12ヶ月無料」という古い説明は現在のFree Tierの構成とは異なるので使わない）。
  - AWSサポートプランの現行の名称・内容（Basic Supportは全アカウント自動無料、という点は安定している
    が、上位プランの名称は変わることがあるため、断定的な名称を書く場合は確認すること）。
  - サービスの料金モデルの具体的な数値（割引率、無料枠の上限値など）は、断定せずに一般的な
    説明にとどめるか、確認できた場合のみ具体的な数値を書く。
  - 確認が取れない事実は、無理に断定的な問題にせず、確実に正しいと分かる内容の問題にすること。
5. 新規項目を書き終えたら、再度 `python3 scripts/validate_content.py` を実行し、
   exit code 0（エラーなし）であることを確認する。**エラーが残っている状態でコミットしない。**
6. 変更を確認してコミットする。
   - 対象ファイルは `js/data/clf-c02.js` のみ（このランブックや他ファイルを編集した場合はそれも含める）。
   - コミットメッセージ例: `Add N CLF-C02 content items (vocab a / practice b / mock c)`
   - 末尾に `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` を付ける。
7. push前に **もう一度** `git pull --rebase` する。
   - push が non-fast-forward で拒否された場合、1回だけ `git pull --rebase` して再試行する。
   - それでも失敗した場合は `--force` を使わず、変更をコミットしたまま終了する
     （次回の実行、またはユーザーが手動で解決する）。
8. 最後に、このファイルの末尾の「進捗ログ」に1行追記する（日時・この回の追加件数・累計件数）。

## 禁止事項

- `git push --force` / `git reset --hard` / `--no-verify` は使わない。
- `master`以外のブランチへのpushや、新しいブランチの作成はしない。
- 既存の項目のID・正解・選択肢を書き換えない（バグ修正が明確に必要な場合を除き、ユーザーに確認せず
  既存コンテンツを変更しない）。
- `js/data/clf-c02.js` 以外の実装ファイル（`js/app.js`, `css/style.css` など）は変更しない
  （構造変更が必要だと感じた場合は、変更せずにこのファイルの末尾にその提案を書き残す）。
- 3プールすべてが目標に達している場合、空コミットや無意味な変更を作らない。

## 進捗ログ（この末尾に追記していく）

- 2026-10-12: 初期シード投入（このセッションで実施）。VOCAB=48, PRACTICE=46, MOCK_POOL=24。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=52, PRACTICE=59, MOCK_POOL=28。追加トピック: AWS Config, Amazon Inspector, ACM, Cognito, ECS, Aurora, SQS, Elastic Beanstalk, S3 Glacier, Pricing Calculator, AWS Marketplace, Fault Tolerance, Disaster Recovery, Edge Location。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=56, PRACTICE=72, MOCK_POOL=32。追加トピック: Amazon ElastiCache, Amazon Macie, 水平/垂直スケーリング（Scale Out/Scale Up）、ACM（証明書管理の別視点）、ECS（コンテナオーケストレーション）、Aurora（移行ユースケース）、SQS（デカップリング）、Elastic Beanstalk、Pricing Calculator、Well-Architected運用上の優秀性の柱、セキュリティグループ/NACL比較、S3/EBS/EFSストレージ種別比較。新規出典2件（elasticache, macie）はWebSearchでaws.amazon.com配下のページ存在を確認（この実行環境ではaws.amazon.com/docs.aws.amazon.comへの直接fetchがプロキシでブロックされており、WebFetchによる本文直接確認はできなかった点に留意）。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=60, PRACTICE=85, MOCK_POOL=36。追加トピック: AWS Cloud Adoption Framework (CAF)、移行戦略(Migration Strategies: Repurchase/Retire等)、クラウド導入モデル(ハイブリッドクラウド)、AWS IAM Identity Center、保管時/転送中の暗号化(KMS/ACMの違い)、AWS Security Hub、Amazon SNS（SNS対SQS比較）、AWS Snow Family、Amazon Redshift（OLAP対RDS/DynamoDB）、サーバーレスコンピューティング比較(Lambda/Fargate対EC2/Lightsail)、Consolidated Billing（一括支払い）、AWS Compute Optimizer、EC2購入オプション比較(Spot/Reserved/Savings Plans/On-Demand)。新規出典9件（caf, migrationStrategies, iamIdentityCenter, securityHub, sns, snowFamily, redshift, consolidatedBilling, computeOptimizer, transitGateway）はすべてWebSearchでdocs.aws.amazon.com/aws.amazon.com配下の実在ページを確認してから追加（この実行環境でもaws.amazon.com/docs.aws.amazon.comへの直接WebFetchは相変わらずDNS/プロキシでブロックされ、本文の直接確認はできなかった）。移行戦略は現在のAWS公式ガイドでは7R's（Retire/Retain/Rehost/Relocate/Repurchase/Replatform/Refactor）だが、出題は個々の定義（Repurchase/Retire）に絞り「6/7」という総数には言及しない形にして正確性を確保した。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=64, PRACTICE=98, MOCK_POOL=40。追加トピック: AWS Systems Manager（Session Managerによるポートレス/キーレスアクセス）、Amazon API Gateway、AWS Network Firewall（セキュリティグループ/NACLとの多層防御比較）、規模の経済(Economies of Scale)、高可用性(HA)対耐障害性(FT)の違い、AWS Transit Gateway（PRACTICE側に新規追加）、AWS Marketplace、現行のAWS Free Tier構成（常時無料/新規クレジット/短期トライアルの3区分）、コスト最適化系サービスの組み合わせ(Trusted Advisor+Compute Optimizer)。新規出典3件（systemsManager, apigateway, networkFirewall）はWebSearchでdocs.aws.amazon.com配下の該当ページ（what-is-systems-manager.html, apigateway/.../welcome.html, network-firewall/.../what-is-aws-network-firewall.html）が実在することを確認してから追加（本実行環境でも docs.aws.amazon.com への直接WebFetchはDNS解決エラーでブロックされ、本文の直接確認はできなかったため、WebSearchの検索結果上でのタイトル・URL一致で確認）。正解位置は単純な0,1,2,3の固定ローテーションではなく、全体の分布が概ね均等になるよう一部を手動で調整（最終配分: 0が4件、1が5件、2が4件、3が4件の単一選択、複数選択は{0,2}{1,3}{0,3}{1,2}の4通り）。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=68, PRACTICE=111, MOCK_POOL=44（3プールとも各ドメイン比率は目標26/25/33/16%にほぼ一致）。追加トピック: Well-Architected持続可能性の柱、AWS Directory Service、Amazon EventBridge、AWS Cost and Usage Report (CUR)、疎結合アーキテクチャ(Loose Coupling)、AWS Cloud Adoption Framework、複数AZ配置によるHA設計、AWS CloudHSM(対KMS)、AWS Firewall Manager、Amazon Detective、最小権限の原則、Amazon ECR、AWS Global Accelerator(対CloudFront)、Amazon Kinesis Data Streams、VPC NATゲートウェイ、AWS Step Functions、AWS Shield Standard対Advanced、AWS Direct Connect(対VPN/Transit Gateway)、Amazon Lightsail、EC2リザーブドインスタンスの支払いオプション(All/Partial/No Upfront)。新規出典13件（directoryService, eventbridge, cur, cloudhsm, firewallManager, detective, ecr, globalAccelerator, kinesis, natGateway, stepFunctions, lightsail, ec2Ri）はすべてWebSearchでdocs.aws.amazon.com（firewallManagerはwaf developerguide配下のfms-chapter.html、detectiveはuserguide配下のwhat-is-detective、stepFunctionsはapireference配下のWelcome.html）またはaws.amazon.com（lightsail）の実在ページを確認してから追加（本実行環境でも docs.aws.amazon.com / aws.amazon.com への直接WebFetchはDNS解決エラーでブロックされ続けており、本文の直接確認はできなかったため、WebSearchの検索結果上でのタイトル・URLの一致で確認）。正解位置は単一選択(single)4ブロック×4件を0,1,2,3で意識的にローテーションし（各位置3件ずつで完全に均等）、複数選択(multi)は{0,2}の1件を追加。追加前のvalidate_content.py実行結果と比較し、既存52〜98件の項目は一切変更していないことを確認済み。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=72, PRACTICE=124, MOCK_POOL=48（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB tech24/security18/billing11/concepts19、PRACTICE concepts33/billing19/security31/tech41、MOCK_POOL concepts12/security12/tech16/billing8）。追加トピック: AWS Batch、Amazon FSx、Amazon Cognito（ユーザープール対IDプール）、Well-Architectedパフォーマンス効率の柱、CapEx/OpEx変換、移行戦略「リホスト」、AWS CAFの観点(ビジネス/ガバナンス/プラットフォーム)、AWS Shield Standard対Advanced、IAMポリシー種別(IDベース/リソースベース)、Amazon ElastiCacheの用途、Amazon Redshift(データウェアハウス)、AWS Cost Explorer、現行のAWS Free Tier構成、Amazon GuardDuty、Savings Plans(複数コンピューティングサービス横断)。新規出典2件（batch, fsx）はWebSearchでdocs.aws.amazon.com配下の実在ページ（batch/latest/userguide/what-is-batch.html、fsx/の公式ドキュメントランディングページ）を確認してから追加。他はすべて既存SOURCESを再利用（別角度の設問として追加）。正解位置は単一選択17件を0,1,2,3で意識的にローテーションし(0が5件、1〜3が各4件でほぼ均等)、複数選択4件は{0,1}{1,2}{2,3}{0,3}の4通りの組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存72件（VOCAB68/PRACTICE111/MOCK_POOL44）の項目は一切変更していないことを確認済み。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=76, PRACTICE=137, MOCK_POOL=52（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB tech25/security19/billing12/concepts20、PRACTICE concepts36/billing22/security34/tech45、MOCK_POOL concepts13/security13/tech17/billing9）。追加トピック: AWS Well-Architected Tool(Frameworkとの違い)、AWS IAM Access Analyzer(外部共有の検出)、AWS Outposts(ハイブリッド/オンプレミス拡張)、ハイブリッドクラウドの定義、AWS Organizations SCP(権限の上限/管理アカウントへの非適用)、AWS Security Hub(検出結果の集約)、Amazon EKS対ECS(Kubernetes)、AWS Glue(ETL)、Amazon Athena(S3への直接SQLクエリ)、Amazon QuickSight(BIダッシュボード)、AWS Storage Gateway(ハイブリッドストレージ)、Amazon EC2 On-Demand Capacity Reservation(容量確保、割引なし)、AWSサポートプラン(Basic Supportの無料範囲)、AWS Marketplace(サードパーティ課金の一括請求)。新規出典8件（watool, accessAnalyzer, outposts, eks, glue, quicksight, storagegateway, capacityReservation, athena=計9件）はすべてWebSearchでdocs.aws.amazon.com（wellarchitected/userguide/intro.html、IAM/.../what-is-access-analyzer.html、outposts/.../what-is-outposts.html、eks/.../what-is-eks.html、glue/.../what-is-glue.html、athena/.../what-is.html、AWSEC2/.../ec2-capacity-reservations.html）またはaws.amazon.com（quicksight/, storagegateway/）の実在ページを確認してから追加（本実行環境でも docs.aws.amazon.com/aws.amazon.com への直接WebFetchはDNS解決エラーでブロックされ続けており、本文の直接確認はできなかったため、WebSearchの検索結果上でのタイトル・URLの一致・他言語ミラーの存在で確認）。正解位置はVOCAB4件を0,1,2,3でローテーション、PRACTICEの単一選択12件は0,1,2,3を3周して完全に均等、複数選択1件(SCP)は{1,3}、MOCK_POOLの単一選択4件も0,1,2,3でローテーション。追加前後でvalidate_content.pyの出力・git diffを確認し、既存124件（VOCAB72/PRACTICE124/MOCK_POOL48）の項目は一切変更していないことを確認済み。
- 2026-10-12: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。累計 VOCAB=80, PRACTICE=150, MOCK_POOL=56（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB tech26/security20/billing13/concepts21、PRACTICE concepts39/billing24/security37/tech50、MOCK_POOL concepts14/security14/tech18/billing10）。追加トピック: Amazon WorkSpaces(DaaS)、AWS Control Tower(ランディングゾーン/ガードレール)、AWS PrivateLink(VPCエンドポイント経由のプライベート接続)、AWS Cost Anomaly Detection(機械学習による異常コスト検知)、AWS CAFガバナンスの視点、クラウドの6つのメリット(キャパシティ予測不要)、GuardDuty/Security Hub/Detectiveの比較、KMS/Secrets Manager/CloudHSMの比較、AWS DataSync(オンプレミス-S3間の転送・同期)、Amazon OpenSearch Service(全文検索・ログ分析)、AWS X-Ray(分散トレーシング)、Amazon Comprehend(NLP、複数選択問題)、Savings Plans対リザーブドインスタンス比較。新規出典8件（workspaces, controlTower, privatelink, datasync, opensearch, xray, comprehend, costAnomalyDetection）はすべてWebSearchでdocs.aws.amazon.com配下の実在ページ（workspaces/latest/adminguide/amazon-workspaces.html、controltower/latest/userguide/what-is-control-tower.html、vpc/latest/privatelink/what-is-privatelink.html、datasync/latest/userguide/what-is-datasync.html、opensearch-service/latest/developerguide/what-is.html、xray/latest/devguide/aws-xray.html、comprehend/latest/dg/what-is.html、cost-management/latest/userguide/manage-ad.html）を検索結果上のタイトル・URL一致・他言語ミラーの存在で確認してから追加。今回もWebFetchをdocs.aws.amazon.comに対して試したが、DNS解決エラー(ENOTFOUND)で失敗したため、WebSearchのフォールバックで全件確認した（本文の直接取得は今回も不可）。正解位置はVOCAB4件・PRACTICE単一選択12件・MOCK_POOL4件の合計20件を0,1,2,3で完全に均等ローテーション(各位置5件)、複数選択1件(Comprehend)は{1,3}を使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存150件（VOCAB76/PRACTICE137/MOCK_POOL52）の項目は一切変更していないことを確認済み。
- 2026-10-13: **ルーティン設定のバグを発見・修正**。この回以降、定期実行のクラウドサンドボックスが
  起動時に`master`以外のブランチ（`claude/amazing-lovelace-<random>`）をチェックアウトした状態に
  なっており、各回の実行はそれに気づかず新しいブランチにコミット・pushし続けていた
  （ルーティン設定`job_config.ccr.session_context.outcomes`のブランチ指定が原因。設定を修正し、
  プロンプトにも「必ずmasterで作業する」旨を明記した上に、このファイルの手順0・禁止事項にも
  同様の確認手順を追記した）。その結果、2026-10-12〜13の間に積み上がった20本の孤立ブランチ
  （いずれも同じ`master`のVOCAB80/PRACTICE150/MOCK_POOL56を起点に、互いの存在を知らず
  並行してv81-84/p151-163/m57-60という同一ID範囲で21件ずつ追加していたため、単純mergeは不可能）
  について、ユーザーの指示のもとで手作業により重複を除いて統合した。具体的には:
  全20ブランチの新規項目（VOCAB 5件×20=100件、PRACTICE 13件×20=260件、MOCK_POOL 4件×20=80件、
  うちVOCABの1件/ブランチはdiffの表示上のアーティファクトで実体は既存v80と同一だったため除外）を
  比較し、VOCABは同一用語(term)の重複を除いて45件に、PRACTICE/MOCK_POOLは同一テーマ
  （同じAWSサービス・同じ概念）の重複を原則2件（PRACTICE）/1件（MOCK_POOL、ただしcafとbudgetsは
  内容が明確に異なる複数のサブトピックを含んでいたため全件残した）までに絞り込んでPRACTICE 160件・
  MOCK_POOL 63件に整理（migrationStrategies・caf・sixAdv・wafReliability・drStrategiesの5クラスタは
  複数の異なるAWSサービス/概念を1つの出典にまとめて扱っていたため、重複ではなく内容を個別に確認して
  手動で選定）。採用した項目はv81-125/p151-310/m57-119として連番で振り直し、重複して追加されていた
  出典(SOURCES)エントリ（表記ゆれを含む）も1つに統合（例: `backup`/`awsbackup`→`backup`、
  `awshealth`/`healthDashboard`→`awsHealth`、`mq`/`amazonmq`→`amazonMQ`等）。採用した新規出典
  URL42件は統合前にすべてWebFetchで直接内容を確認済み（1件のみ訂正: AWS MGNは現在
  「AWS Transform MGN」に名称変更されており、該当する3項目(v84/p151/m57)の文言も修正した）。
  結果、累計 VOCAB=125, PRACTICE=310, MOCK_POOL=119。統合後、20本の孤立ブランチは削除した。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時に起動直後のサンドボックスが
  `master`からdetached HEADの状態になっていたため（前回記録したブランチ事故とは別件）、まず
  `git checkout master && git pull --rebase origin master`で正しい状態に復帰してから作業した。
  累計 VOCAB=129, PRACTICE=323, MOCK_POOL=123（3プールとも各ドメイン比率は目標26/25/33/16%に近い:
  VOCAB tech32/security26/billing16/concepts27、PRACTICE concepts27/billing16/security24/tech33、
  MOCK_POOL concepts27/security24/tech32/billing17）。追加トピック: Amazon Security Lake（新規）、
  Amazon Kinesis Data Streams、AWS Step Functions、コスト配分タグ(Cost Allocation Tags)、クラウドの
  6つのメリット(Go Global in Minutes / 固定費を可変費へ)、Well-Architected Frameworkの柱(多肢選択)、
  ハイブリッドクラウド、Amazon Macie、AWS IAM Access Analyzer、AWS Shield/WAF(DDoS対策、多肢選択)、
  Amazon OpenSearch Service、AWS Pricing Calculator、Savings Plans対リザーブドインスタンス比較、
  Amazon GuardDuty、OCSFスキーマ。新規出典1件（securityLake）はWebFetchで
  `docs.aws.amazon.com/security-lake/latest/userguide/what-is-security-lake.html`の本文を直接取得・確認
  できた（**今回はWebFetchが成功**し、本文の直接確認ができた）。なお同じ回でAmazon Connectと
  AWS App Runnerの2サービスもWebFetchで本文を確認したが、Connectは「Amazon Connectは現在エージェント型
  AIソリューション群の名称に変わり、従来のAmazon Connect（コンタクトセンター機能）は"Connect Customer"
  という名称になった」という最近の大きな名称変更が、App Runnerは「新規顧客への提供を終了し既存顧客のみ
  利用可能（新規にはECS Express Modeを推奨）」という状態変更がそれぞれ確認され、断定的な出題にすると
  不正確になるリスクが高いと判断し、**この2つは今回の追加対象から除外**した（他のソースは全て既存の
  SOURCESを再利用し、別角度の設問として追加）。正解位置はVOCAB4件・PRACTICE単一選択11件・MOCK_POOL
  単一選択3件の合計18件の単一選択問題を0,1,2,3でおおむね均等にローテーション(0が5件、1が5件、2が5件、
  3が3件)、複数選択3件(PRACTICE2件・MOCK_POOL1件)は{0,2}{1,3}{0,3}の3通りの異なる組み合わせを使用。
  追加前後でvalidate_content.pyの出力・git diffを確認し、既存323件（VOCAB125/PRACTICE310/MOCK_POOL119）
  の項目は一切変更していないことを確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`
  からdetached HEADの状態になっており、かつ直前の実行（上記エントリ）のコミット(b931963)がローカルの
  `master`ブランチに反映されていなかった（コミット自体はorigin/masterには既にpush済みだったことを
  `git pull --rebase`で確認）。`git checkout master && git pull --rebase origin master`でfast-forwardして
  正しい状態に復帰してから新規追加作業を開始した。累計 VOCAB=133, PRACTICE=336, MOCK_POOL=127（3プール
  とも各ドメイン比率は目標26/25/33/16%に近い: VOCAB tech32/security26/billing16/concepts26、PRACTICE
  concepts26/billing16/security25/tech33、MOCK_POOL concepts26/security24/tech32/billing17）。追加トピック:
  Amazon Timestream（新規）、AWS IoT Core（新規）、AWS Cost Categories（新規）、AWS Private CA/AWS
  Certificate Manager Private CA（新規）、Amazon Keyspaces for Apache Cassandra（新規）、ACM(パブリック証明書)
  対Private CA(プライベート証明書)比較、VPC Flow Logs対CloudTrail対Config比較、AWS Verified Access対
  Site-to-Site VPN、AWS KMSのキー種別(AWSマネージドキー/カスタマーマネージドキー)、VPCゲートウェイ
  エンドポイント対インターフェースエンドポイント(PrivateLink)、サーバーレスDB比較(DynamoDB/Keyspaces対
  RDS/Neptuneのプロビジョンドモード)、AWS Cost Explorerの購入推奨機能、Cost Categories対コスト配分タグ、
  CloudWatch料金アラーム対AWS Budgets。新規出典5件（timestream, iotcore, costCategories, acmpca,
  keyspaces）はすべて本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回はWebFetchが実行
  全件で成功**）、該当ページ本文を直接取得・確認した上で追加した（costCategoriesのみ初回フェッチでは
  見出しのみ返り、WebSearchで正しいURL(awsaccountbilling/latest/aboutv2/manage-cost-categories.html)を
  特定してから再度WebFetchし本文を確認）。既存の`acm`・`kms`・`vpcFlowLogs`・`verifiedAccess`・
  `privatelink`・`costExplorer`・`budgets`等のSOURCESは別角度の新規設問として再利用し、使用頻度が
  著しく高い`sixAdv`(30件)・`caf`(13件)・`iam`系・`accessAnalyzer`(7件)・`hybridCloud`(6件、ほぼ同一文言の
  重複が多い)は今回新規追加の対象から意図的に除外した。正解位置は単一選択18件(VOCAB4・PRACTICE11・
  MOCK_POOL3)を0,1,2,3で均等にローテーション(各位置4〜5件)、複数選択3件(PRACTICE2・MOCK_POOL1)は
  {0,1}{0,2}{1,3}の3通りの異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffを確認し、
  既存336件中の新規追加前の323件の項目は一切変更していないことを確認済み（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目に追加のためのカンマを付与した4箇所のみが既存行の変更として表示され、
  内容自体の変更はなし）。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっており、`git checkout master && git pull --rebase origin master`でfast-forward
  して正しい状態に復帰してから作業した。累計 VOCAB=137, PRACTICE=349, MOCK_POOL=131（3プールとも各ドメイン
  比率は目標26/25/33/16%に極めて近い: VOCAB tech32.8/security24.8/billing16.1/concepts26.3、PRACTICE
  concepts25.5/billing16.0/security24.9/tech33.5、MOCK_POOL concepts25.2/security25.2/tech32.8/billing16.8）。
  追加トピック: AWS AppSync（新規）、AWS Fault Injection Service (FIS)（新規）、ボリュームディスカウント
  （段階的価格、既存pricing出典の新角度）、Well-Architected各柱の個別の設計原則(design principles)を複数
  追加——コスト最適化の柱「効率の測定」「費用の分析と帰属」、パフォーマンス効率の柱「サーバーレスアーキ
  テクチャを使用する」、持続可能性の柱「マネージドサービスを使用する」、セキュリティの柱「セキュリティを
  全レイヤーに適用する」「セキュリティのベストプラクティスを自動化する」（いずれも既存のWAF系source
  を再利用しつつ、既存項目とは異なる具体的な設計原則を扱うことで重複を回避）。加えてコンプライアンス
  プログラムの参照方法、AWS Verified Accessの特徴、VPC Flow Logsの発行先(S3/CloudWatch Logs)、AWS Glueの
  データカタログ、AWS Global Accelerator、Amazon QuickSightの料金モデル、S3 Glacier Flexible Retrievalの
  取り出しオプション(Expedited/Bulk)、VPC NATゲートウェイの高可用性構成、AWS Cost Explorerのカスタム
  レポート、AWS X-Ray(サーバーレス構成でのトレーシング)、Amazon Comprehend(感情分析)、SCPの特徴(ルート
  ユーザーへの影響・管理アカウント不適用)を、いずれも既存SOURCESを再利用した別角度の設問として追加
  （既存項目との重複を避けるため、各sourceの既存設問内容を事前にgrepで確認した上で執筆）。新規出典2件
  （appsync, fis）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが
  成功**）、本文を直接確認した上で追加した。S3 Glacierの取り出し時間(Expedited 1-5分/Bulk 5-12時間)は
  WebSearchで最新のAWS公式ドキュメントの数値を確認して採用した。正解位置は単一選択19件を0,1,2,3で
  均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件は{1,3}と{0,2}の異なる組み合わせを
  使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存336件の項目は一切変更していないこと
  （diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態だったため`git checkout master && git pull --rebase origin master`で復帰してから作業した。累計
  VOCAB=141, PRACTICE=362, MOCK_POOL=135（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.6/security24.8/billing16.3/concepts26.2、PRACTICE concepts25.1/billing16.3/security24.6/tech34.0、
  MOCK_POOL concepts25.2/security25.2/tech32.6/billing17.0）。追加トピック: AWS CodeBuild（新規）、AWS
  CodeDeploy（新規）、AWS Cost Optimization Hub（新規）、責任共有モデル(RDS等マネージド型DBのOSパッチ
  適用責任)、AWS CAFのセキュリティ視点(これで6つの視点を全て網羅)、AWS Systems Manager パラメータストア
  対Secrets Managerのコスト・用途比較、AWS WAFのレート制限ルール、S3標準-IA対One Zone-IA対Glacier Deep
  Archive対Intelligent-Tieringの使い分け、AWS CodeBuild/CodeDeploy/CodePipelineの役割分担、Amazon
  Rekognitionの動画コンテンツモデレーション、AWS DataSync対Snowballの使い分け、Amazon Lex/Transcribe/
  Pollyの役割分担、AWS Compute Optimizer対Cost Optimization Hubの違い、AWS Basic Supportプランに含まれる
  範囲、Amazon CognitoのIDプール(一時的なAWS認証情報の発行)、AWS Migration Evaluatorの役割、AWS Budgets
  対Cost Anomaly Detectionの使い分け。新規出典3件（codebuild, codedeploy, costOptimizationHub）はすべて
  本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した
  上で追加した。なお「AWSサポートプランでTAM(Technical Account Manager)が専任で付くのはどのプランか」を
  WebSearchで確認したところ、Enterprise SupportとUnified Operationsの両方にTAMが含まれる可能性がある
  (どちらが正確に対応するか単一の公式ページで確認できなかった)ため、単一の正解に断定する出題は避け、
  「Basic Supportには含まれない」という確実な事実のみを問う出題に変更した。同様にCloudTrail Lakeは
  2026年5月31日付で新規顧客への提供が終了予定であることがWebSearchで判明したため、出題対象から除外し、
  代わりにAmazon CognitoのIDプールの話題に差し替えた。新規追加前後でvalidate_content.pyの出力・git diffを
  確認し、既存349件の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾
  項目にカンマを付与した4箇所のみ）を確認済み。正解位置は単一選択19件を0,1,2,3でほぼ均等にローテーション
  (各位置4〜5件)、複数選択2件は{1,3}と{0,2}の異なる組み合わせを使用。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっており、`git checkout master && git pull --rebase origin master`で復帰してから
  作業した。累計 VOCAB=145, PRACTICE=375, MOCK_POOL=139（3プールとも各ドメイン比率は目標26/25/33/16%に近い:
  VOCAB tech32.4/security24.8/billing16.6/concepts26.2、PRACTICE concepts25.1/billing16.5/security24.5/
  tech33.9、MOCK_POOL concepts25.2/security25.2/tech32.4/billing17.3）。追加トピック: AWS CodeArtifact（新規）、
  Amazon AppFlow（新規）、EC2 Image Builder（新規）、Amazon Verified Permissions（新規）、Amazon EC2 Reserved
  Instance Marketplace（新規、出品条件とRI売却後のオンデマンド課金の2問）、Total Cost of Ownership (TCO)の
  考え方（新規、Well-Architectedのコスト最適化の柱のベストプラクティスを出典として追加）、AWS Firewall Manager
  （既存source、VOCAB初追加）、AWS Cost Optimization Hub（既存source、VOCAB初追加）、Well-Architected各柱の
  未出題だった設計原則（コスト最適化「消費モデルの導入」、パフォーマンス効率「メカニカルシンパシーを持つ」、
  持続可能性「使用率を最大化する」、セキュリティ「強固なアイデンティティ基盤を実装する」「トレーサビリティを
  維持する」）、Elastic Load Balancingの種類比較(ALB/NLB/GLBの2問、既存source初のPRACTICE活用)、EC2リザーブド
  インスタンスの支払いオプション「Partial Upfront」、AWS Trusted Advisorのコアチェック/フルチェックとサポート
  プランの対応、AWS Artifactの「Agreements」機能、AI/MLサービスの組み合わせ問題(Transcribe+Comprehend)、AWS
  Snowball Edgeのエッジコンピューティング用途。新規出典6件（tco, codeartifact, appflow, imageBuilder,
  verifiedPermissions, riMarketplace）はすべて本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し
  （**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なお当初VOCABの新規サービス候補として
  Amazon QLDB (Quantum Ledger Database) を検討したが、WebSearchで「2025年7月31日付で全面的にサービス終了・
  新規顧客受付は2024年半ばに終了済み」であることが判明したため、既に廃止されたサービスとして出題対象から
  除外し、代わりにAWS CodeArtifactに差し替えた。またAWS TCOの出典についても、当初想定していた「AWS TCO
  Calculator」という単体ツールが`aws.amazon.com/tco-calculator/`から`calculator.aws`（AWS Pricing Calculator）
  へリダイレクトされ、独立したツールとして現存しないことをWebFetchで確認したため、特定のツール名には言及せず
  Well-Architected Frameworkのベストプラクティス(COST05-BP03)の一般的なTCOの定義のみを出題内容とした。既存の
  飽和気味のsource（wafReliability21件・sixAdv30件・acm/secretsmanager/shield/securityHub/macie等、ほぼ同一
  文言の設問が複数存在するもの）は今回の新規追加の対象から意図的に避け、未出題の設計原則や新規サービスを
  優先した。正解位置はVOCAB4件を0,1,2,3でローテーション、PRACTICE単一選択11件を0,1,2,3でほぼ均等に
  ローテーション（各位置2〜3件）、PRACTICE複数選択1件は{1,3}、MOCK_POOL単一選択4件を0,1,2,3でローテーション。
  追加前後でvalidate_content.pyの出力・git diffを確認し、既存362件の項目は一切変更していないこと（diffは
  SOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`した時点で既にローカルの`master`がorigin/masterの
  最新コミット(3522d75)を指していたため、`git pull --rebase`はfast-forward不要で即座に完了した。累計
  VOCAB=149, PRACTICE=388, MOCK_POOL=143（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.9/security24.8/billing16.8/concepts25.5、PRACTICE concepts25.0/billing16.8/security24.5/tech33.8、
  MOCK_POOL concepts25.2/security25.2/tech32.2/billing17.5）。追加トピック: AWS Wavelength（新規）、AWS
  CloudShell（新規）、Amazon Lightsail（既存source、VOCAB初追加）、Amazon Verified Permissions（既存source、
  VOCAB初追加・PRACTICE定義角度追加）、Amazon EC2 Reserved Instance Marketplace（既存source、VOCAB初追加）、
  Amazon Route 53のヘルスチェック/フェイルオーバールーティング、Network Load Balancer(NLB、超低レイテンシー・
  静的IP)、Amazon EBSスナップショットの増分バックアップ、AWS Configのコンフォーマンスパック、AWS Directory
  ServiceのAD Connector(オンプレミスADへのプロキシ)、AWS Local ZonesとAWS Wavelengthの比較、責任共有モデル
  (セキュリティグループ設定は常に顧客責任)、AWS Well-Architected Toolの特徴(無料・マイルストーン記録)、EC2
  Instance Savings Plans対Compute Savings Plansの違い、AWS Billing Conductorのプロフォーマ請求と実際の
  支払いの関係、AWS Cost Optimization Hub対AWS Compute Optimizerの関係、RPOの定義(事前目標値としての許容
  データ損失量)、AWS Network Firewallのステートレス/ステートフルルールグループとルーティング構成。新規出典
  2件（wavelength, cloudshell）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回も
  WebFetchが成功**）、本文を直接確認した上で追加した。他はすべて既存SOURCESを、grepで既存設問内容を事前に
  確認した上で、まだ出題されていない具体的な事実・角度に絞って再利用した（例: route53は既存のDNS+地理的
  ルーティング問題とは別にヘルスチェック/フェイルオーバーを、elbは既存のALBパスベース/GWLB問題とは別にNLBを、
  ebsは既存のルートボリューム問題とは別に増分スナップショットを扱った）。1件のみ当初案から差し替え: Amazon
  Inspectorの「Lambda関数スキャン」は既存のp51/m26で既に出題済みと判明したため、代わりにAWS Directory
  ServiceのAD Connectorに差し替えた。正解位置は単一選択18件(VOCAB4・PRACTICE11・MOCK_POOL3)を0,1,2,3で
  均等にローテーション(各位置4〜5件)、複数選択3件(PRACTICE2・MOCK_POOL1)は{0,2}{1,3}{0,3}の3通りの異なる
  組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存375件の項目は一切変更して
  いないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を
  確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`すると、ローカルの`master`がこのdetached HEAD
  より6コミット古い状態（`origin/master`とは一致）であることが判明した。detached HEAD側は過去6回分の定期
  実行セッションがコミットまでは完了していたがローカルの`master`ブランチへの反映が漏れていたもので、
  `git log`で各コミットの内容・進捗ログの記述を確認した結果、正当な既存の追加作業（VOCAB80→149、
  PRACTICE150→388、MOCK_POOL56→143）であり、`origin/master`ともdetached HEADの祖先関係が一直線
  （fast-forward可能）であることを`git merge-base --is-ancestor`で確認できたため、`git merge --ff-only`で
  このdetached HEADの内容をローカル`master`に取り込み、`python3 scripts/validate_content.py`でエラーが
  無いことを確認してから`git pull --rebase origin master`（fast-forward不要で即完了）・`git push origin
  master`を実行して復旧した（pushは既にorigin側が同じコミットを保持していたため実質no-op）。復旧後、
  累計VOCAB=149, PRACTICE=388, MOCK_POOL=143の状態から今回分の新規追加作業を開始した。追加後の累計は
  VOCAB=153, PRACTICE=401, MOCK_POOL=147（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech33.3/security24.8/billing16.3/concepts25.5、PRACTICE concepts25.2/billing16.7/security24.7/
  tech33.4、MOCK_POOL concepts25.2/security25.2/tech32.7/billing17.0）。追加トピック: Amazon AppFlow
  （既存source、VOCAB初追加）、AWS Certificate Manager (ACM)の基本定義（既存source、VOCAB初追加）、
  Well-Architected運用上の優秀性の柱の総称VOCAB項目（既存source）、AWS IoT Greengrass（新規、VOCAB・
  PRACTICE・MOCK_POOLの3プールで導入）、Well-Architected各柱の未出題だった具体的な設計原則（運用上の
  優秀性「運用をコードとして実行する」、持続可能性「影響を理解する」、コスト最適化「費用の分析と帰属」、
  セキュリティ「セキュリティインシデントに備える」「データから人を遠ざける」）、RTO/RPOの違いを問う比較形式
  の複数選択問題、AWS WAFのマネージドルールグループ、AWS Security Incident Response（新規）、VPCピアリング
  対AWS Transit Gatewayの使い分け、Amazon ECRの拡張スキャン機能(Amazon Inspector連携)、AWS Cost Explorerの
  リザーブドインスタンス/Savings Plans利用率・カバレッジレポート、Amazon EC2リザーブドインスタンスの
  「変更(モディファイ)」機能、Amazon S3の「One Zone-IA」ストレージクラス。新規出典2件（iotGreengrass,
  securityIR）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、
  本文を直接確認した上で追加した。なおAWS IoT Greengrassの確認中、2026年10月7日付でAWS IoT Greengrass
  Version 1のサポートが終了していたことがWebFetchで判明したため、出題内容はすべて現行のVersion 2を前提とした
  記述にした。また、VOCABの新規追加候補としてAWS Application Discovery Serviceを検討したが、WebFetchで
  「新規顧客への提供を終了しており、代替としてAWS Transformの利用が推奨されている」ことが判明したため、
  出題対象から除外し、代わりにAWS IoT GreengrassをVOCABに追加した。既存の飽和気味のsource（marketplace7件・
  pricing6件・secretsmanager5件・macie4件等、ほぼ同一文言の設問が複数存在するもの）は今回の新規追加の対象
  から意図的に避けた。正解位置はVOCAB4件・PRACTICE単一選択10件・MOCK_POOL単一選択4件の合計18件の単一選択
  問題を0,1,2,3でおおむね均等にローテーション(0が5件、1が5件、2が4件、3が4件)、複数選択3件(PRACTICE3件)は
  {0,3}{0,2}{1,3}の3通りの異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffを確認し、
  既存388件(復旧後の基準)の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの
  末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`した時点で既にローカルの`master`が
  `origin/master`の最新コミット(2b074ff)を指していたため、`git pull --rebase`はfast-forward不要で
  即座に完了した。累計 VOCAB=157, PRACTICE=414, MOCK_POOL=151（3プールとも各ドメイン比率は目標
  26/25/33/16%に近い: VOCAB tech33.1/security24.8/billing16.6/concepts25.5、PRACTICE
  concepts25.4/billing16.4/security24.9/tech33.3、MOCK_POOL concepts25.2/security25.2/tech32.5/
  billing17.2）。追加トピック: Amazon Bedrock（新規）、AWS IAM Roles Anywhere（新規）、AWS Data
  Exports（新規）、Amazon S3 Storage Lens（新規）、移行戦略「リテイン(Retain)」、Well-Architected
  パフォーマンス効率の柱の未出題設計原則（高度なテクノロジーを誰でも使えるようにする／実験の頻度を
  増やす。いずれも従来は他問題の不正解選択肢の文言としてのみ存在し、正解として問う専用問題はこの回が
  初出）、コスト最適化の柱「クラウド財務管理を導入する」、持続可能性の柱の未出題設計原則（持続可能性の
  目標を設定する／ダウンストリームへの影響を削減する）、Amazon GuardDutyの個別保護機能(S3 Protection/
  RDS Protection、従来は汎用的な脅威検知の説明に留まっていたが今回初めて機能別に出題)、AWS KMSの
  カスタマーマネージドキー対AWSマネージドキーの自動ローテーション仕様の違い、Amazon SageMaker・
  AWS AppSyncのシナリオ形式の設問(いずれも既存VOCABの定義紹介のみでPRACTICE/MOCK_POOLでは今回が初出)、
  AWS Supportプランの「24時間365日のワークロードモニタリング」がUnified Operations限定である点。
  新規出典4件（bedrock, rolesAnywhere, dataExports, storageLens）はすべて本実行環境でWebFetchが
  docs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した
  （dataExportsは`cur/latest/userguide/dataexports.html`への初回フェッチではタイトルのみ返り、
  WebSearchで正しいURL(`cur/latest/userguide/what-is-data-exports.html`)を特定してから再度WebFetch
  し本文を確認）。なおAmazon Q Businessを新規VOCAB候補として検討したが、WebFetchで「新規顧客への
  提供を終了しており、代替としてAmazon Quickを案内している」ことが判明したため、既存の除外事例
  （QLDB・Application Discovery Service・Connect・App Runner・CloudTrail Lake等）と同様の理由で
  出題対象から除外し、代わりにAmazon Bedrockを採用した。既存の飽和気味のsource（acmpca3件・RAM4件・
  firewallManager4件・verifiedAccess4件・GuardDuty7件・wafReliability21件等、ほぼ同一文言や類似シナリオ
  の設問が複数存在するもの）は今回の新規追加の対象から意図的に避け、未出題の具体的な機能・設計原則を
  優先した。正解位置は単一選択19件(VOCAB4・PRACTICE12・MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション
  (0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE1・MOCK_POOL1)は{0,2}と{1,3}の異なる組み合わせ
  を使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存401件の項目は一切変更していない
  こと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を
  確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`
  からdetached HEADの状態になっていたが、`git checkout master`すると、ローカルの`master`が
  `origin/master`最新コミット(ad135cf)と完全に一致していたため、`git pull --rebase`はfast-forward不要
  で即座に完了した。累計 VOCAB=161, PRACTICE=427, MOCK_POOL=155（3プールとも各ドメイン比率は目標
  26/25/33/16%に近い: VOCAB tech32.9/security24.8/billing16.8/concepts25.5、PRACTICE
  concepts25.3/billing16.4/security24.8/tech33.5、MOCK_POOL concepts25.2/security25.2/tech32.9/
  billing16.8）。追加トピック: Amazon Personalize（新規）、AWS AppConfig（新規）、Amazon Managed
  Workflows for Apache Airflow (MWAA)（新規）、AWS Organizations（既存source、VOCAB初追加・委任管理者
  (delegated administrator)の仕組みをPRACTICEで新規出題）、AWS Cost Explorer（既存source、VOCAB初追加・
  ライトサイジング推奨機能をPRACTICEで新規出題）、移行戦略「リファクター(Refactor/Re-architect)」
  （VOCAB新規）・「リロケート(Relocate、VMware Cloud on AWS)」（PRACTICE新規）、AWS Storage Gatewayの
  Volume Gateway（キャッシュ型ボリューム、既存のFile/Tape Gatewayとは別角度）、CloudFormation
  StackSets（複数アカウント・リージョンへの一括展開）、Well-Architectedセキュリティの柱「保管中および
  転送中のデータを保護する」（これでセキュリティの柱の7設計原則すべてを網羅）、運用上の優秀性の柱
  「頻繁に、小規模かつ可逆的な変更を行う」・「すべての運用上の失敗から学ぶ」、コスト最適化の柱
  「差別化につながらない重い作業にお金を使わない」、Amazon Verified PermissionsとAWS IAMの役割の違い、
  AWS Cost Anomaly Detectionの根本原因分析(Root Cause Analysis)機能、Amazon GuardDutyのMalware
  Protection for EC2（S3/RDS Protectionとは別の保護機能）。新規出典3件（personalize, appconfig, mwaa）
  はすべて本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を
  直接確認した上で追加した。なおAmazon ForecastとAmazon Kendraも新規VOCAB候補として確認したところ、
  両方ともWebFetchで「新規顧客への提供を終了している」ことが判明したため、既存の除外事例と同様の理由で
  出題対象・出典候補から除外した。また「AWS Cost Categoriesはコスト配分タグと異なり過去データに遡及
  適用できる」という当初の着想も、WebSearchで2024年3月にコスト配分タグ側にも遡及適用機能が追加された
  ことが判明し、両者を区別する決定的な違いとしては現在不正確なため出題を見送った。既存の飽和気味の
  source（wafReliability21件・wafSecurity(セキュリティの柱の個別設計原則は本回で全7種を使い切ったため
  今後は別の既存FAQ的内容での再利用に限定)・GuardDuty・organizations等）は、既出内容と重複しない具体的な
  未出題の事実・角度であることを個別にgrepで確認した上でのみ利用した。正解位置は単一選択11件
  (VOCAB4・PRACTICE9・MOCK_POOL4のうち単一選択)を0,1,2,3でほぼ均等にローテーション、複数選択2件
  (PRACTICE2件: MWAA・Organizations委任管理者)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後で
  validate_content.pyの出力・git diffを確認し、既存414件の項目は一切変更していないこと（diffはSOURCES/
  VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached
  HEADの状態になっていたが、`git checkout master`した時点でローカル`master`は既に`origin/master`の
  最新コミット(f99284e)と一致していたため、`git pull --rebase`はfast-forward不要で即座に完了した。
  累計 VOCAB=165, PRACTICE=440, MOCK_POOL=159（3プールとも各ドメイン比率は目標26/25/33/16%に近い:
  VOCAB tech32.7/security24.8/billing16.4/concepts26.1、PRACTICE concepts25.5/billing16.1/
  security25.0/tech33.4、MOCK_POOL concepts25.8/security25.2/tech32.7/billing16.4）。追加トピック:
  AWS Nitro System（新規、仮想化の分離とAmazon従業員を含む運用者アクセス排除というセキュリティ上の
  利点）、AWS Amplify Hosting（新規、Git連携CI/CDによるフルスタックWebアプリのホスティング）、
  耐久性(Durability)の定義と可用性(Availability)との違い、AWS Well-Architected Framework全体の目的
  (個別の柱ではなく総論、既存源流wafの別角度)、Total Cost of Ownership(TCO)算出に含めるべき要素
  (複数選択)、水平/垂直スケーリングの使い分けの理由、AWS Control Tower(ランディングゾーン/ガードレール)、
  AWSコンプライアンスプログラムページ(AWS Artifactとの役割の違い)、AWS Directory Serviceの
  AWS Managed Microsoft AD対Simple AD対AD Connector、Infrastructure as Code(IaC)の概念とAWS
  CloudFormation、Amazon FSx for Windows File Server対Amazon EFS、Amazon SNS/SQSによるファンアウト
  パターン(複数選択)、AWS Data Exports(Parquet形式でのS3出力・Athena/QuickSight連携)。新規出典2件
  （amplify, nitroSystem）はいずれも本実行環境でWebFetchがdocs.aws.amazon.com/aws.amazon.comに対して
  成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なおAmazon Pinpointを新規VOCAB
  候補として確認したところ、WebFetchで「2026年10月30日付でサポート終了予定」であることが判明したため、
  既存の除外事例（QLDB・Application Discovery Service・Connect・App Runner・CloudTrail Lake・Amazon
  Q Business・Amazon Forecast・Kendra等）と同様の理由で出題対象から除外し、代わりにAWS Amplifyを採用
  した。既存の飽和気味のsource（sixAdv30件・wafReliability21件・migrationStrategies15件・caf14件等）は
  今回の新規追加の対象から意図的に避け、moderate(3〜10件程度)の既存sourceの再利用と2件の新規source追加
  で構成した。正解位置は単一選択19件(VOCAB4・PRACTICE11・MOCK_POOL4)を0,1,2,3でほぼ均等にローテーション
  (0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件: TCO構成要素・SNS/SQSファンアウト)は
  {0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存
  427件の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目に
  カンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached
  HEADの状態になっていたが、`git checkout master`した時点でローカル`master`は既に`origin/master`の
  最新コミット(91d8956)と一致していたため、`git pull --rebase`はfast-forward不要で即座に完了した。
  累計 VOCAB=169, PRACTICE=453, MOCK_POOL=163（3プールとも各ドメイン比率は目標26/25/33/16%に近い:
  VOCAB tech32.5/security24.9/billing16.6/concepts26.0、PRACTICE concepts25.4/billing16.1/
  security24.9/tech33.6、MOCK_POOL concepts25.8/security25.2/tech32.5/billing16.6）。追加トピック:
  Amazon MemoryDB（新規、ElastiCacheとの違い=耐久性のあるプライマリDBとして使える点）、AWS Clean Rooms
  （新規、データを開示せずに複数企業でコラボレーション分析できる点）、ディザスタリカバリ戦略
  「Warm Standby」（VOCAB初出、既存source drStrategiesの別角度）、EC2 Convertible Reserved
  Instances（VOCAB初出、Standard RIとの違い=構成交換可能だが割引率が低くMarketplaceで売却不可、既存
  source ec2Riの別角度）、AWS CodeArtifact（パッケージリポジトリ、ECR/CodeCommitとの比較）、AWS
  CloudShell（ブラウザ上のターミナル、Systems Manager Session Managerとの違い）、Amazon Managed
  Workflows for Apache Airflow (MWAA)（既存Airflow DAGの移行、Step Functionsとの違い）、Amazon S3
  Storage Lens（複数アカウント・リージョンの可視化、複数選択問題）、AWS Security Incident Response
  （インシデント対応の人的支援、GuardDuty/Detectiveとの違い）、AWS Private CAをAWS RAMで複数アカウント
  に共有する方法、Well-Architected運用上の優秀性の柱の未出題だった設計原則2つ（障害を予測する
  (Anticipate failure)／運用手順を頻繁に改善する(Refine operations procedures frequently)、これで
  運用上の優秀性の柱の5設計原則すべてを網羅）、TCOがクラウド移行でコスト削減につながる理由（過剰な
  事前投資が不要になる点）、On-Demand Capacity Reservationに割引を適用する方法（リージョナルRI/
  Savings Plansとの組み合わせ）。新規出典2件（memorydb, cleanrooms）はいずれも本実行環境でWebFetchが
  docs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。
  既存の飽和気味のsource（sixAdv30件・wafReliability21件・migrationStrategies15件・caf14件・costmgmt
  16件等）は今回の新規追加の対象から意図的に避け、1〜4件程度の軽めの既存sourceの再利用（codeartifact,
  cloudshell, mwaa, storageLens, securityIR, acmpca, tco, capacityReservation等）と2件の新規source
  追加で構成した。なおAWS CodePipeline/Amazon EMR/AWS Resource Access Manager単体での新規出題は
  既存問題との重複が大きいと判断し見送り、代わりにPrivate CAとRAMを組み合わせた複合問題に差し替えた。
  正解位置は単一選択19件(VOCAB4・PRACTICE11・MOCK_POOL4)を
  0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件:
  S3 Storage Lens・AWS Clean Rooms)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.py
  の出力・git diffを確認し、既存440件の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached
  HEADの状態になっており、ローカル`master`も`origin/master`から14コミット遅れていたが、
  `git checkout master && git pull --rebase origin master`でfast-forwardして正しい状態（最新コミット
  69013bd）に復帰してから作業した。累計 VOCAB=173, PRACTICE=466, MOCK_POOL=167（3プールとも各ドメイン
  比率は目標26/25/33/16%に近い: VOCAB tech32.4/security24.9/billing16.8/concepts26.0、PRACTICE
  concepts25.3/billing16.1/security24.9/tech33.7、MOCK_POOL concepts25.7/security25.1/tech32.3/
  billing16.8）。追加トピック: Amazon Q Developer（新規、IDE統合の生成AI開発アシスタント、Amazon Q
  Businessとの違い）、AWS AppFabric（新規、複数SaaSアプリの監査ログをOCSFに正規化して集約するセキュリティ
  サービス、AWS Security Hub/CloudTrailとの違い）、Amazon EC2のリザーブドインスタンスの「リージョナル
  スコープ対ゾーナルスコープ」の違い（既存source ec2Riの新角度、容量確保の保証範囲と割引適用範囲の違いを
  VOCAB/PRACTICE/MOCK_POOLで出題）、RTO(目標復旧時間)の定義（既存source rtorpoのVOCAB初出、RPO/
  可用性/SLAとの区別）、Amazon Kinesis Data Streamsの「シャード」という容量単位（既存source kinesisの
  新角度）、AWS Schema Conversion Tool (SCT)とAWS DMSの役割分担（既存source dmsの新角度）、Amazon
  OpenSearch Serviceのベクトル検索(k-NN)によるRAG実装（既存source opensearchの新角度、生成AI関連の
  新しいユースケース）、AWS Control TowerとAWS Organizationsの関係（既存source controlTowerの新角度）、
  AWS Resilience HubとAWS Elastic Disaster Recovery (AWS DRS)の役割の違い（既存source resilienceHubの
  新角度）、AWSグローバルインフラストラクチャの構成要素を問う複数選択（既存source globalInfraの新角度）、
  Savings Plansのコミットメント構造($/時・1年/3年、既存source savingsplansTypesの新角度）、AWS Nitro
  Enclaves（既存source nitroSystemの新角度、機密データ処理用の隔離実行環境とアテステーション機能）。
  新規出典2件（qDeveloper, appfabric）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し
  （**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なおAmazon Q Developerのドキュメントには
  「2027年4月30日付でIDEプラグイン単体の形態は終了予定（後継はKiro）」という記載があったが、これはIDE
  プラグインという特定の提供形態の終了であり、Amazon Q Developerという生成AIアシスタント自体の提供終了
  ではないため、特定の提供形態(IDEプラグイン名)には言及せず、サービス全体としての一般的な機能・特徴のみを
  出題内容とした。既存の飽和気味のsource（sixAdv30件・wafReliability21件・waf10件・globalInfra8件(今回で
  9件目)・drStrategies7件・shared9件・marketplace7件等）は今回の新規追加の対象から意図的に避けた
  （globalInfraのみ、複数選択という従来にない出題形式のため例外的に1件追加）。正解位置は単一選択19件
  (VOCAB4・PRACTICE12・MOCK_POOL3のうち単一選択)を0,1,2,3でほぼ均等にローテーション(各位置4〜5件)、
  複数選択2件(PRACTICE1・MOCK_POOL1、いずれもAWS Control Towerの正誤選択)は{0,2}と{1,3}の異なる組み合わせ
  を使用。追加前後でvalidate_content.pyの出力・git diffを確認し、既存453件の項目は一切変更していないこと
  （diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
  また、node (vm.runInContext) で実際にファイルを評価し、構文エラーなくVOCAB/PRACTICE/MOCK_POOLの配列が
  期待通りの件数で読み込めることも追加で確認した。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached
  HEADの状態になっていたが、`git checkout master`した時点でローカル`master`は既に`origin/master`の
  最新コミット(5c84e34)と一致していたため、`git pull --rebase`はfast-forward不要で即座に完了した。累計
  VOCAB=177, PRACTICE=479, MOCK_POOL=171（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.2/security24.9/billing17.0/concepts26.0、PRACTICE concepts25.3/billing16.1/security24.8/
  tech33.8、MOCK_POOL concepts25.7/security25.1/tech32.2/billing17.0）。追加トピック: Amazon DataZone
  （新規、データカタログ・ガバナンス・ビジネスグロッサリーの2問）、AWS re:Post（新規、コミュニティ主導の
  無料Q&Aサービス。無料/Premium Supportとの違い、2024年8月追加のAWS Support Officialチャンネルの3問）、
  AWS Signer（新規、Lambdaデプロイパッケージのコード署名、IoTデバイスのOTAファームウェア署名の3問）、
  移行戦略「リタイア(Retire)」VOCAB新規・「リパーチェス(Repurchase)」PRACTICE新規（これで7つのRすべてを
  VOCAB/PRACTICEで個別に出題済み）・7つのRの名称識別を問う複数選択（MOCK_POOL新規、Rewrite/Resizeという
  非公式用語を紛らわしい誤答として使用）、AWS Outposts/Local Zones/Wavelengthの比較（複数選択、既存source
  outpostsの新角度）、AWS Well-Architected Framework持続可能性の柱の設計原則「新しい、より効率的なハード
  ウェア・ソフトウェアの採用を予測して採用する」（これで持続可能性の柱の6設計原則すべてを網羅）、AWS
  CloudTrailの管理イベント対データイベントの違い、AWS KMSのマルチリージョンキー、AWS Glue DataBrew
  （既存source glueの新角度、コード不要のビジュアルデータ準備）、Amazon QuickSightの生成AI機能（現行名称
  Amazon Q in QuickSight、旧称QuickSight Qから正式名称が変更されている点を確認して反映）、Amazon Keyspaces
  とAmazon DynamoDBの違い(CQL互換性)・Keyspacesの特徴(サーバーレス・ドライバー互換性)の2問。新規出典3件
  （dataZone, repost, signer）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し
  （**今回もWebFetchが成功**）、本文を直接確認した上で追加した。re:Postの出典URLはdocs.aws.amazon.com配下に
  適切なページが無かったため、WebFetchで内容を確認済みのaws.amazon.com配下の公式発表ページ
  (whats-new/2021/12/aws-repost-...)をsourceとして採用した。なお当初VOCAB/PRACTICEの新規候補として
  AWS Snowcone(Snow Familyの小型エッジデバイス)を検討したが、WebSearchで「2024年11月12日付で新規提供が
  終了し、既存デバイスのサポートも2025年11月12日に終了済み」であることが判明したため、既存の除外事例
  （QLDB・Pinpoint・Amazon Forecast・Kendra等）と同様の理由で出題対象から除外し、代わりにAmazon DataZoneを
  追加した。また、Amazon QuickSight Qは現在「Amazon Q in QuickSight」に名称変更されていることをWebSearchで
  確認し、新規項目では現行名称を主として記載した（既存のQuickSight関連項目は変更していない）。AWS
  Well-Architectedコスト最適化の柱の設計原則「マネージドサービスの活用」を新規項目の候補として検討したが、
  WebFetchで公式ページを確認した結果、同柱の設計原則は5つ(Implement Cloud Financial Management/Adopt a
  consumption model/Measure overall efficiency/Stop spending money on undifferentiated heavy lifting/
  Analyze and attribute expenditure)であり、該当する内容は既存の「差別化につながらない重い作業にお金を
  使わない」の説明に含まれ別個の設計原則ではないと判明したため、重複を避けてこの項目の追加を見送った
  （持続可能性の柱の方で6設計原則中の未出題分を代わりに採用）。既存の飽和気味のsource（sixAdv30件・
  wafReliability21件・migrationStrategies(追加前)15件・caf14件等）は今回も意図的に避けた。正解位置は
  単一選択19件(VOCAB4・PRACTICE12のうち単一選択・MOCK_POOL3のうち単一選択)を0,1,2,3で均等にローテーション
  (各位置4〜5件)、複数選択2件(PRACTICE1・MOCK_POOL1)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後で
  validate_content.pyの出力・git diffおよびnode(vm.runInContext)での読み込みを確認し、既存466件の項目は
  一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した
  4箇所のみ）を確認済み。
- 2026-10-13: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`すると、ローカルの`master`が`origin/master`最新
  コミット(475e4a0)と完全に一致していたため、`git pull --rebase`はfast-forward不要で即座に完了した。累計
  VOCAB=181, PRACTICE=492, MOCK_POOL=175（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.6/security25.4/billing16.6/concepts25.4、PRACTICE concepts25.4/billing16.1/security25.0/
  tech33.5、MOCK_POOL concepts25.7/security25.1/tech32.6/billing16.6）。追加トピック: Amazon CodeGuru
  Profiler（新規）、AWS Resource Groups（新規、タグベース/CloudFormationスタックベースのクエリ・ネスト機能）、
  AWS License Manager（既存source、VOCAB初追加・BYOLライセンスの上限コア数管理）、AWS Systems Manager
  パラメータストア（既存source、VOCAB初追加・SecureStringのKMS暗号化と標準/アドバンストティアの違い）、AWS
  Verified Access（ゼロトラスト・VPN不要）、AWS CloudHSM対AWS KMS（シングルテナント専有対マルチテナント
  管理型）、AWS Cost Optimization Hub（組織全体のメンバーアカウントを横断した推奨事項の集約）、AWS Billing
  Conductor（課金グループとマージンを用いたプロフォーマ請求、既存source初の「課金グループ」角度）、CloudFront
  の「リージョナルエッジキャッシュ」（エッジロケーションとの違い、新角度）、AWS Well-Architected Framework
  の6つの柱の歴史（持続可能性の柱が後から6つ目として追加された点）、ハイブリッドクラウドの段階的移行という
  利点、AWSグローバルインフラストラクチャの「リージョン」の特徴（複数選択）。新規出典2件（codeguru,
  resourceGroups）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが
  成功**）、本文を直接確認した上で追加した。なおAmazon CodeGuru Reviewerは2025年11月7日付で新規リポジトリ
  連携の受付を終了しメンテナンスモードに入っていることがWebSearchで判明したため、Reviewerではなく現行も
  通常提供されているCodeGuru Profilerの機能に限定して出題した。同様にAmazon Chimeアプリケーション本体も
  2026年2月20日付でサポート終了していることがWebSearchで判明したため(Chime SDKは提供継続)、既存の除外事例
  （QLDB・Pinpoint・Amazon Forecast・Kendra・Connect・App Runner等）と同様の理由でChime関連の新規追加は
  見送った。既存のSavings Plansのコンピュート横断フレキシビリティ(Compute Savings Plans)の角度は既に複数回
  出題済みと判明したため、当初案だったbilling(savingsplansTypes)の1件はAWS Resource Groupsのネスト機能
  (tech)に差し替えた。他にもfirewallManager・accessAnalyzer・mfa・macie・detective・pricingcalc・budgets・
  consolidatedBilling・costAllocTags・capacityReservation・riMarketplace等、既存の設問内容をgrepで確認した
  結果すべて飽和気味と判断し、今回の新規追加の対象からは避けた。正解位置は単一選択19件(VOCAB4・PRACTICE12・
  MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE1・
  MOCK_POOL1)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffおよび
  node(vm.runInContext)での読み込みを確認し、既存479件の項目は一切変更していないこと（diffはSOURCES/VOCAB/
  PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master && git pull --rebase origin master`で復帰してから
  作業した（ローカルmasterはこの時点でorigin/masterの最新コミットより遅れており、fast-forwardで復帰）。
  累計 VOCAB=185, PRACTICE=505, MOCK_POOL=179（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech33.0/security25.4/billing16.8/concepts24.9、PRACTICE concepts25.3/billing16.0/security25.0/tech33.7、
  MOCK_POOL concepts25.7/security25.1/tech32.4/billing16.8）。追加トピック: Amazon Data Firehose（新規）、
  Amazon Managed Grafana（新規）、AWS Security Incident Response（既存source、VOCAB初追加）、AWS Compute
  Optimizer（既存source、VOCAB初追加）、Amazon CloudFront Origin Access Control (OAC)対Origin Access
  Identity (OAI)の違い、AWS Fault Injection Service (FIS)の停止条件(Stop Condition)、AWS CodeDeployの
  カナリア/リニア/AllAtOnceデプロイ設定、Amazon VPC Flow Logsの記録対象外トラフィック(AmazonProvidedDNS・
  インスタンスメタデータ等)、AWS Private CAの証明書失効(OCSP/CRL)、Amazon Cognitoのトークン種別(ID/
  アクセス/リフレッシュトークン、複数選択含む)、AWS Local Zones(親リージョンのVPC拡張の仕組み、VPC
  エンドポイント非対応等の制約)、Amazon S3 Transfer Acceleration(CloudFrontのエッジロケーション経由の
  高速化、既存source edgelocationの新角度)、AWS Resilience Hubのレジリエンシースコア、コスト配分タグの
  AWS生成タグ/ユーザー定義タグの有効化(既存source costAllocTagsの新角度、複数選択含む)、AWS Cost
  Categoriesの分割請求ルール(Split Charge Rules、既存source costCategoriesの新角度)。新規出典2件
  （firehose, grafana）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回も
  WebFetchが成功**）、本文を直接確認した上で追加した。CloudFront OACとS3 Transfer Acceleration、FISの
  停止条件、VPC Flow Logsの記録対象外トラフィック、AWS Private CAの失効方式、Cognitoのトークン、AWS
  Cost Categoriesの分割請求ルールもすべてWebSearch/WebFetchで公式ドキュメント(docs.aws.amazon.com)の
  記述を確認してから出題内容を作成した。なおAWS Outposts(1U/2Uサーバー形態)を新規VOCAB候補として
  WebSearchで確認したところ、「Outposts servers(1U/2U)は新規販売を終了しており、既存顧客はOutposts
  rackへの移行が案内されている」ことが判明したため、既存の除外事例（QLDB・Pinpoint・Amazon Forecast・
  Chime・AWS Proton・AWS App Mesh(2026年9月30日サポート終了予定)等）と同様の理由でこの角度の出題は
  見送り、代わりにAWS Local Zonesの仕組みに関する出題に差し替えた。また、AWS Proton(2026年10月7日付で
  サポート終了)とAWS App Mesh(2026年9月30日付でサポート終了予定)を新規SOURCES候補としてWebSearchで
  確認したが、いずれも終了済み・終了予定のサービスであるため出典・出題対象から除外した。既存の飽和気味の
  source（sixAdv30件・wafReliability21件・migrationStrategies18件・wafOps11件・waf11件・ec2Ri11件・
  Well-Architectedの各柱の個別設計原則は全て出題済みのもの等）は今回の新規追加の対象から意図的に避けた。
  今回はtech(特にVOCAB/PRACTICE)の比率がやや高め(新規source2件を両方techに配置したため)になったが、
  concepts向けの手頃な未出題トピックが払底気味であることが一因であり、累計の3プール全体としては目標比率
  からの乖離は小さい。正解位置は単一選択19件(VOCAB4・PRACTICE12・MOCK_POOL3)を0,1,2,3でほぼ均等に
  ローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE1・MOCK_POOL1)は{0,2}と{1,3}の
  異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diffおよびnode(vm.runInContext)での
  読み込みを確認し、既存492件の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOL
  それぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`すると、ローカルの`master`は既に`origin/master`
  最新コミット(b7fbe7f)と18コミット分遅れていたため、`git pull --rebase origin master`でfast-forwardして
  復帰してから作業した。累計 VOCAB=189, PRACTICE=518, MOCK_POOL=183（3プールとも各ドメイン比率は目標
  26/25/33/16%に近い: VOCAB tech32.8/security25.4/billing16.9/concepts24.9、PRACTICE
  concepts25.1/billing16.0/security25.1/tech33.8、MOCK_POOL concepts25.7/security25.1/tech32.2/
  billing16.9）。追加トピック: AWS IoT Device Defender（新規、IoTデバイスのAudit/Rules Detect/ML Detect/
  Mitigation Actions機能）、Amazon Managed Service for Prometheus（新規、PromQL互換のサーバーレスコンテナ
  メトリクス監視、クロスリージョン集約のアグリゲーターリージョン設定）、AWS Resource Explorer（新規、
  複数リージョン・アカウント横断の検索エンジン的リソース検索、Resource Groups/Configとの違い）、クラウドの
  デプロイモデル(パブリック/プライベート/ハイブリッド/マルチクラウドの識別、既存source hybridCloudの新角度)、
  AWS Organizationsの管理アカウント(請求の一括受取先であり、LeaveOrganizationでは退出できずDeleteOrganization
  でのみ組織から外れる点、既存source organizationsの新角度)、AWS Artifactの「Agreements」機能(BAA/NDAの締結、
  既存のReports機能とは別角度)、責任共有モデル(データセンターの物理的セキュリティは常にAWS責任/EC2ゲストOS
  パッチは常に顧客責任、既存source sharedの新角度)、AWS Systems Manager Patch Manager(既存source
  systemsManagerの新角度)、AWS Site-to-Site VPNの2トンネル冗長構成(既存source siteToSiteVpnの新角度)、
  Amazon Managed GrafanaのIAM Identity Center/SAML認証(既存source grafanaの新角度)、AWS CodeArtifactの
  外部接続(パブリックリポジトリのアップストリーム・キャッシュ、既存source codeartifactの新角度)、Amazon MQの
  デプロイモード(シングルインスタンス対アクティブ/スタンバイ、既存source amazonMQの新角度)、AWS Marketplace
  のプライベートオファー(セラー・バイヤー間のカスタム価格/EULA、有効期限切れ時の挙動、既存source marketplace
  の新角度)。新規出典3件（iotDeviceDefender, prometheus, resourceExplorer）はすべて本実行環境でWebFetchが
  docs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。Amazon MQの
  デプロイモード、Site-to-Site VPNの2トンネル構成、Systems Manager Patch Manager、AWS Artifactの
  Agreements機能、AWS Marketplaceのプライベートオファー、AWS Organizationsの管理アカウントの退出制限、
  Amazon Managed GrafanaのIAM Identity Center/SAML認証、AWS CodeArtifactの外部接続は、いずれも既存SOURCESの
  再利用だが、WebSearchで公式ドキュメント(docs.aws.amazon.com)の内容を個別に確認してから出題内容を作成した。
  なおAWS Migration EvaluatorはWebSearchで「公式FAQが現在AWS Transformのアセスメント機能を案内しており、
  AWS Transformへの統合が進んでいる可能性がある」ことが判明したため、既存の除外事例（QLDB・Pinpoint・
  CloudTrail Lake等）と同様の理由でこの回の新規追加候補からは除外した。AWS Application Cost Profilerも
  WebSearchで「2024年9月30日付で新規顧客の受付を終了している」ことが確認できたため、新規出典候補から除外
  した。既存の飽和気味のsource（sixAdv30件・wafReliability21件・migrationStrategies18件・
  costmgmt16件・caf14件等、加えてcostOptimizationHub・capacityReservation・awsHealth・serviceCatalog・
  watool・controlTower・licenseManager・repost・riMarketplace・costExplorer・budgets・billingConductor・
  costAnomalyDetection・cur・pricingcalc・free・config・vpcPeering・eks・dataZone・resourceGroups・
  quicksight・codeguru・amazonMQ(既存角度)・appflow・dataExports等、いずれも既存の設問内容をgrepで確認した
  結果、新規追加に使える未出題の角度が見当たらなかったもの）は今回の新規追加の対象から意図的に避けた結果、
  billing・concepts領域で新規に使える出典が手薄になり、tech・security領域にやや重みが寄った
  (この回の21件の内訳: concepts4/security6/tech7/billing4。目標比率(26/25/33/16%)からの乖離はあるが、
  累計の3プール全体としては目標比率に近い値を維持できている)。正解位置は単一選択19件(VOCAB4・PRACTICE11・
  MOCK_POOL4)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件:
  IoT Device DefenderのDetect機能・Amazon Managed GrafanaのSSO認証方法)は{0,2}と{0,2}の組み合わせを使用
  (SOURCESが異なるため同一組み合わせでも出題内容の重複はない)。追加前後でvalidate_content.pyの出力・git
  diffおよびnode(vm.runInContext)での読み込みを確認し、既存505件の項目は一切変更していないこと（diffは
  SOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master && git pull --rebase origin master`で復帰した
  時点でローカル`master`は既に`origin/master`の最新コミット(前回記録の518件時点)と一致していたため、
  fast-forward不要で即座に完了した。累計 VOCAB=193, PRACTICE=531, MOCK_POOL=187（3プールとも各ドメイン
  比率は目標26/25/33/16%に近い: VOCAB tech32.6/security25.4/billing16.6/concepts25.4、PRACTICE
  concepts25.0/billing16.0/security25.2/tech33.7、MOCK_POOL concepts25.7/security25.1/tech32.6/
  billing16.6）。新規SOURCES3件を追加: AWS Cloud Map（サービスディスカバリー）、AWS IoT SiteWise（産業
  データ収集）、AWS Service Level Agreements（SLA公式ページ）。追加トピック: SLA(Service Level
  Agreement)の定義とRTO/RPOとの違い（VOCAB/PRACTICE/MOCK_POOLの3プールで新規導入）、マルチクラウド
  (Multi-Cloud)のデプロイモデル（既存source hybridCloudの新角度、パブリック/プライベート/ハイブリッドとの
  識別）、最小権限の原則(Principle of Least Privilege)（既存source iamの新角度、IAMポリシー設計の基本
  原則としてVOCAB/PRACTICE/MOCK_POOLで新規導入）、AWS Cloud Map（サービスディスカバリー、Route 53の静的
  DNSやApp Meshとの違い、ヘルスチェック連携、IPアドレスを持たないリソース(DynamoDB/SQS)の登録、VOCAB/
  PRACTICE(単一選択・複数選択)/MOCK_POOLの4問で導入）、AWS IoT SiteWise（産業設備のアセットモデル・
  SiteWise Monitor・SiteWise Edge、VOCAB/PRACTICE/MOCK_POOLの3問で導入）、Amazon S3の耐久性(11ナイン)と
  可用性(Availability)の数値的な違い（既存source wafReliabilityの新角度、複数選択）、Amazon Security
  Lakeのサブスクライバー「クエリアクセス」によるAmazon Athena等からの直接クエリ（既存source
  securityLakeの新角度、既存のOCSF/収集機能とは別の「利用側」の仕組み）、AWS Signerの署名プロファイル
  失効(Revoke Signing Profile)（既存source signerの新角度、鍵漏洩時の対応）、AWS IAM Roles Anywhereの
  トラストアンカー(Trust Anchor)の役割（既存source rolesAnywhereの新角度、既存のp409複数選択とは別に
  単独の定義問題として追加）、Amazon WorkSpaces Applications（旧AppStream 2.0、既存source appstreamの
  2問目）、Amazon EC2 Reserved Instance Marketplaceの売却時のサービス料(12%)とゾーナル/リージョナル
  スコープの出品可否（既存source riMarketplaceの新角度）、売り手登録の制限(米国の銀行口座・生涯の売却
  上限)（既存source riMarketplaceの別角度）。新規出典3件（cloudMap, iotSitewise, slaLegal）のうち
  cloudMapはdocs.aws.amazon.comへのWebFetchが本実行環境で成功し（**今回もWebFetchが成功**）、本文を直接
  確認した。iotSitewiseとslaLegal(aws.amazon.com/legal/配下)はWebSearchの検索結果上でdocs.aws.amazon.com
  /aws.amazon.com配下の実在ページであることを確認した。AWS Signerの失効機能・Security Lakeのサブスクライ
  バークエリアクセス・EC2 Reserved Instance Marketplaceのサービス料率(12%)・売り手登録条件についても、
  いずれもWebSearchで公式ドキュメント(docs.aws.amazon.com)の記述内容を確認してから出題内容を作成した。
  既存の飽和気味のsource（sixAdv30件・wafReliability21件(今回複数選択1件を追加し22件)・
  migrationStrategies18件・iam12件(今回単一選択2件を追加し14件)等）のうち、iamとwafReliabilityのみ、
  既出内容と重複しない具体的な未出題の角度（最小権限の原則、耐久性と可用性の数値的な区別）であることを
  個別にgrepで確認した上で利用した。正解位置は単一選択19件(VOCAB4・PRACTICE11・MOCK_POOL4)を0,1,2,3で
  均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件: S3耐久性/可用性の区別・
  AWS Cloud Mapの特徴)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git
  diffおよびnode(vm.runInContext)での読み込みを確認し、既存518件の項目は一切変更していないこと（diffは
  SOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみ）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`すると、ローカルの`master`が`origin/master`の
  最新コミット(cb63a57)より21コミット古い状態だったため、`git pull --rebase origin master`でfast-forward
  して正しい状態（直前のエントリ記録の累計VOCAB193/PRACTICE531/MOCK_POOL187）に復帰してから作業した。累計
  VOCAB=197, PRACTICE=544, MOCK_POOL=191（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.5/security25.4/billing16.8/concepts25.4、PRACTICE concepts25.0/billing16.0/security25.2/
  tech33.8、MOCK_POOL concepts25.7/security25.1/tech32.5/billing16.8）。新規SOURCES2件を追加: AWS Service
  Quotas（サービスのリソース上限管理）、Amazon EC2 Dedicated Host（専有ホスト）。追加トピック: AWS Service
  Quotas（クォータの引き上げリクエスト、デフォルト値と適用済みクォータの違い、VOCAB/PRACTICE/MOCK_POOLの
  3問で新規導入）、EC2 Dedicated Host（ソケット単位のBYOL対応、Dedicated Instanceとの違い、Dedicated Host
  Reservationによる最大70%割引、無料利用枠の対象外である点、VOCAB/PRACTICE(2問)/MOCK_POOLの4問で新規導入）、
  弾力性(Elasticity)対スケーラビリティ(Scalability)の違い（既存source sixAdvの新角度）、AWS Health Personal
  Health DashboardとService Health Dashboardの違い（既存source awsHealthの新角度）、AWS Shield Advancedの
  コスト保護(Cost Protection)機能とその利用条件（既存source shieldの新角度、VOCAB/PRACTICE/MOCK_POOLの3問）、
  AWS CloudHSMとKMSの違い（FIPS 140-2レベル3のシングルテナントHSM、既存source cloudhsmの新角度）、Amazon
  GuardDutyのEKS Protection/RDS Protection（既存source guarddutyの新角度、複数選択）、AWS CodeBuild対AWS
  CodePipelineの役割分担（既存source codebuildの新角度、VOCAB初導入）、Amazon Route 53の正式なルーティング
  ポリシー（加重・レイテンシーベース、既存source route53の新角度、複数選択）、Amazon EventBridge Scheduler
  によるLambda定期実行（既存source eventbridgeの新角度）、Amazon AthenaとAmazon Redshiftの使い分け・Athenaの
  スキャン量課金モデル（既存source athenaの新角度、PRACTICE/MOCK_POOLの2問）、AWS Organizations一括支払いに
  おけるリザーブドインスタンス/Savings Plansの割引共有（既存source consolidatedBillingの新角度）。新規出典2件
  （serviceQuotas, dedicatedHosts）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し
  （**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なおAWS App Meshを新規VOCAB候補として
  WebFetchで確認したところ、「2026年9月30日付でサポートを終了する」という終了予告(End of support notice)が
  本文冒頭に明記されていたため、既存の除外事例（QLDB・Forecast・Kendra・Connect・App Runner・Application
  Discovery Service・Amazon Q Business等）と同様の理由で出題対象から除外した。既存の飽和気味のsource
  （sixAdv30件・wafReliability22件・migrationStrategies18件・costmgmt16件・iam15件等）は今回の新規追加の
  対象から意図的に避け、新規サービスと未出題の具体的な機能・角度を優先した。正解位置は単一選択18件
  (VOCAB4・PRACTICE11・MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が4件、3が4件)、
  複数選択3件(PRACTICE2・MOCK_POOL1)は{0,2}{1,3}{0,3}の3通りの異なる組み合わせを使用。追加前後で
  validate_content.pyの出力・git diffおよびnode(vm.runInContext)での読み込みを確認し、既存531件の項目は
  一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した
  4箇所のみ）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master && git pull --rebase origin master`で復帰した
  時点でローカル`master`は既に`origin/master`の最新コミット(前回記録の544件時点)と一致していたため、
  fast-forward不要で即座に完了した。累計 VOCAB=201, PRACTICE=557, MOCK_POOL=195（3プールとも各ドメイン
  比率は目標26/25/33/16%に近い: VOCAB tech32.8/security24.9/billing16.4/concepts25.9、PRACTICE
  concepts25.1/billing16.2/security25.1/tech33.6、MOCK_POOL concepts25.6/security25.1/tech32.8/
  billing16.4）。新規SOURCES1件を追加: AWS Transform（メインフレーム/VMware/.NETのモダナイゼーション・
  移行をAIエージェントが支援する後継サービス）。追加トピック: AWS Transform（VOCAB/PRACTICEで導入）、
  アベイラビリティーゾーン(AZ)の定義（既存source globalInfraのVOCAB初出）、リージョン選択時の考慮要素
  (レイテンシー・データレジデンシー、複数選択)、マルチAZ配置によるフォールトアイソレーション、ハイブリッド
  クラウドの具体例(Direct Connect/VPN)、Amazon Transcribe(VOCAB初出)、AWS X-Ray(VOCAB初出・サービスマップ
  機能)、NATゲートウェイ対NATインスタンス(マネージド型・帯域幅)・AZ単位の冗長化、Amazon Lex(Amazon Connect
  + Lambdaによるフルフィルメント、テキストのみでの利用可否)、AWS IAM Identity Centerの「許可セット
  (Permission Set)」、AWS IAM Access Analyzerの「未使用アクセス分析(Unused Access Analysis)」(既存の
  外部アクセス分析とは別角度)、IAM MFAのデバイス種別(仮想認証アプリ/FIDOセキュリティキー/ハードウェアTOTP
  トークン、1つの物理キーを複数アイデンティティで共用可能な点)、AWS Free Tierの「常時無料」が期間無制限で
  Free/Paidどちらのプランでも適用される点、AWS Supportプランの「DevOpsエージェント クレジット」(プラン別の
  付与率)、Business Support+に含まれるWell-Architected Review/プロアクティブなセキュリティレビュー。新規
  出典1件（transform）は本実行環境でWebFetchがdocs.aws.amazon.com/transform/latest/userguide/what-is-service.html
  に対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なお新規候補として検討した
  「AWS Migration Hub」は、WebFetch・WebSearchで「2025年11月7日付で新規顧客の受付を終了し、後継のAWS
  Transformへの移行が案内されている」ことが確認できたため、既存の除外事例（QLDB・Pinpoint・CloudTrail
  Lake・Amazon Q Business等）と同様の理由で出典・出題対象から除外し、代わりにAWS Transformを採用した。
  同様に新規VOCAB候補として検討した「AWS Snowmobile」も、WebSearchで「2024年3月までにAWS公式サイトから
  削除され、現在は提供終了している」ことが確認できたため除外した（関連してAWS Snowballデバイスも2026年
  12月31日付で全リージョンで提供終了予定、Snowball Edgeは2025年11月7日付で新規顧客受付を終了している旨が
  判明したが、既存のsnowFamily関連項目は変更していない。将来Snow Family関連の既存項目を見直す際の参考情報
  としてここに記録しておく）。また、AWS Supportプランの記述については、本実行でaws.amazon.com/premiumsupport/plans/
  をWebFetchで直接確認したところ、現行の4プラン名称(Basic/Business Support+/Enterprise Support/Unified
  Operations)は既存コンテンツの記述と一致していることを再確認した。既存の飽和気味のsource（sixAdv31件・
  wafReliability22件・migrationStrategies18件・costmgmt16件・iam15件・accessAnalyzer(外部アクセス分析の
  角度のみ)7件等）は、未出題の角度(未使用アクセス分析等)であることを個別に確認したもの以外は今回の新規
  追加の対象から避けた。正解位置は単一選択19件(VOCAB4・PRACTICE12・MOCK_POOL3)を0,1,2,3で均等にローテー
  ション(各位置4〜5件)、複数選択1件(PRACTICE1件: リージョン選択の考慮要素)は{1,3}を使用。追加前後で
  validate_content.pyの出力・git diff・node(vm.runInContext)での読み込みを確認し、既存544件の項目は一切
  変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所の
  みで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`した時点でローカルの`master`は`origin/master`
  より古い状態だったため`git pull --rebase origin master`でfast-forwardして復帰した。累計 VOCAB=205,
  PRACTICE=570, MOCK_POOL=199（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.7/security24.9/billing16.6/concepts25.9、PRACTICE concepts25.4/billing16.1/security25.1/
  tech33.3、MOCK_POOL concepts25.6/security25.1/tech32.7/billing16.6）。新規SOURCES5件を追加: AWS
  Well-Architected Tool「レンズ(Lens)」機能、AWS Cloud Value Framework（クラウド導入の価値を測る5つの
  観点）、AWS Network Access Analyzer（ネットワークパスの静的解析）、AWS Elemental MediaConvert
  （ファイルベースの動画トランスコード）、IAM Policy Simulator。追加トピック: Well-Architected
  レンズ（Serverless Applications Lens等、VOCAB/PRACTICE新規導入）、AWS Cloud Value Frameworkの5つの
  価値の観点（コスト削減/スタッフの生産性向上/運用上の回復性/ビジネスアジリティ/持続可能性、複数選択含む
  VOCAB/PRACTICE/MOCK_POOLの4問）、AWS Well-Architected Toolのレンズ選択機能（既存source watoolの新角度）、
  ディザスタリカバリ「バックアップ&リストア」戦略（既存source drStrategiesの新角度、最も低コストだが
  RTO/RPOが最大）、AWS Network Access Analyzer（VOCAB/PRACTICEの2問）、AWS Audit Managerの事前定義済み
  フレームワークライブラリ（既存source auditManagerの新角度）、IAM Policy Simulator（複数選択含む
  PRACTICE/MOCK_POOLの2問）、AWS Elemental MediaConvert（VOCAB/PRACTICE/MOCK_POOLの3問）、Amazon EC2
  インスタンスタイプのファミリー比較（既存source ec2の新角度）、Amazon CloudWatch複合アラーム(Composite
  Alarm、既存source cloudwatchの新角度）、AWS Service QuotasのCloudWatchアラーム連携（既存source
  serviceQuotasの新角度）、AWS Trusted Advisorの全チェック利用に必要なサポートプラン(Business Support+
  以上、既存source trustedadvisorの新角度）。新規出典5件はすべて本実行環境でWebFetchが
  docs.aws.amazon.com/aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で
  追加した。特にAWS Cloud Value Frameworkは、学習時点の知識では「4つの価値の柱」という古い情報を想定して
  いたが、WebFetchでaws.amazon.com/executive-insights/content/business-value-on-aws/を確認した結果、
  現行は「コスト削減・スタッフの生産性向上・運用上の回復性・ビジネスアジリティ・持続可能性」の5つの
  観点であることが判明したため、5つの観点として出題内容を修正した（まさにランブックが警告する
  「変化しやすい事実」の実例）。同様にIAM Policy Simulatorも、2026年7月30日付でIAMコンソールに統合され
  SCPのテストにも対応したという最近の変更がWebSearchで判明したため、特定のURL形態や「スタンドアロンの
  ツール」という古い言及は避け、機能面の記述に限定した。既存の飽和気味のsource（sixAdv31件・
  wafReliability22件・migrationStrategies18件・iam15件・mfa6件・iamIdentityCenter5件・ram5件等）は
  今回の新規追加の対象から意図的に避けた。正解位置は単一選択19件(VOCAB4・PRACTICE11・MOCK_POOL4)を
  0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件: Cloud
  Value Frameworkの価値の観点・IAM Policy Simulatorのテスト対象)は{0,2}と{1,3}の異なる組み合わせを使用。
  追加前後でvalidate_content.pyの出力・git diff・node(vm.runInContext)での読み込みを確認し、既存557件の
  項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを
  付与した4箇所のみで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態だったが、`git checkout master`した時点でローカルの`master`は既に`origin/master`の最新コミット
  (前回記録の570/557/199件時点)と一致していたため、fast-forward不要で即座に完了した。累計 VOCAB=209,
  PRACTICE=583, MOCK_POOL=203（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech32.5/security24.9/billing16.7/concepts25.8、PRACTICE concepts25.2/billing16.1/security25.0/
  tech33.6、MOCK_POOL concepts25.6/security25.1/tech32.5/billing16.7）。新規SOURCES4件を追加: Amazon
  Location Service（地図・ジオコーディング・ルート・ジオフェンス・トラッカー）、AWS Device Farm（実機での
  モバイルアプリテスト）、AWS Skill Builder（AWS公式の学習プラットフォーム）、AWS Partner Network (APN)
  （パートナー企業のグローバルコミュニティ）。追加トピック: Amazon Location Service（VOCAB/PRACTICEで導入、
  基本定義とジオフェンス/トラッカー機能）、AWS Device Farm（VOCAB無し・PRACTICE/MOCK_POOLで導入、実機
  テストの地域制約とリモートアクセス対自動テスト実行の違い）、AWS Skill Builder（VOCAB/PRACTICE2問/
  MOCK_POOLで導入、無料コース対サブスクリプション、ハンズオンラボ、認定合格後のデジタルバッジ）、AWS
  Partner Network（VOCAB/PRACTICE2問/MOCK_POOLで導入、コンサルティングパートナーの役割、AWS Marketplace
  やAWS Professional Servicesとの違い）、AWS WAF Bot Control（既存source wafServiceの新角度、VOCAB初導入・
  CAPTCHA/Challengeアクションの上書き・Common対Targetedの検出レベル差）、AWS Elastic Beanstalkの環境タイプ
  （Webサーバー環境対ワーカー環境、既存source beanstalkの新角度）、Amazon OpenSearch Serverless対
  プロビジョンドクラスター（既存source opensearchの新角度）、AWS Resource Explorerのインデックス作成/
  有効化要件（既存source resourceExplorerの新角度、初回追加のp516とは異なる角度）、EC2 Image Builderの
  テストコンポーネント・ディストリビューション設定（既存source imageBuilderの新角度、初回追加のp370とは
  異なる角度）、AWS IAM Access Analyzerのポリシー検証(Policy Validation)機能（既存source accessAnalyzerの
  新角度、エラー/セキュリティ警告/一般警告/提案の4種類、外部アクセス分析・未使用アクセス分析とは異なる
  角度）、Amazon Cognitoの脅威保護(Threat Protection)機能（既存source cognitoの新角度、漏洩認証情報検出と
  適応型認証、複数選択）。新規出典4件（locationService, deviceFarm, skillBuilder, partnerNetwork）のうち、
  locationServiceとdeviceFarmは本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetch
  が成功**）、本文を直接確認した上で追加した。skillBuilderとpartnerNetworkはaws.amazon.com/training/・
  aws.amazon.com/partners/に対してWebFetchが成功し本文を確認した。またAWS WAF Bot Control・IAM Access
  Analyzerのポリシー検証機能・Amazon CognitoのThreat Protection機能（2017年当初は「Advanced Security
  Features」という名称だったが現行ドキュメントでは「Threat Protection」に名称変更されている点を確認）に
  ついては、既存SOURCESの再利用のためURL確認は必須ではなかったが、事実の正確性を期すためWebSearchで現行
  の仕様・名称を確認してから出題内容を作成した。AWS Partner NetworkとAWS Professional Servicesの違いに
  ついては、AWS公式の直接的な比較ページが検索で見つからなかったため、両者が別組織である（Professional
  ServicesはAWS自身のコンサルティング部門、APNはサードパーティ企業のコミュニティ）という確実に正しいと
  判断できる一般的な事実のみを出題し、両者の使い分けの詳細な基準（料金・対応可否等）には踏み込まなかった。
  既存の飽和気味のsource（sixAdv31件・wafReliability22件・waf(基本)11件・shared11件・marketplace9件・
  guardduty11件・accessAnalyzer7件→8件・support10件・budgets8件等）は、未出題の具体的な機能・角度で
  あることを個別にgrepで確認したaccessAnalyzerのポリシー検証機能を除き、今回の新規追加の対象から意図的に
  避けた。正解位置は単一選択19件(VOCAB4・PRACTICE12・MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション
  (0が4件、1が5件、2が5件、3が5件)、複数選択2件(PRACTICE1・MOCK_POOL1)は{0,2}と{1,3}の異なる組み合わせを
  使用。追加前後でvalidate_content.pyの出力・git diff・node(vm.runInContext)での読み込みを確認し、既存
  570/557/199件(VOCAB/PRACTICE/MOCK_POOL)の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態になっていたが、`git checkout master`した時点でローカルの`master`は既に`origin/master`の最新
  コミットと一致していたため、fast-forward不要で即座に完了した。累計 VOCAB=213, PRACTICE=596,
  MOCK_POOL=207（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech33.3/security24.4/billing16.4/concepts25.8、PRACTICE concepts25.2/billing16.1/security25.2/
  tech33.6、MOCK_POOL concepts25.6/security25.1/tech32.4/billing16.9）。新規SOURCES2件を追加: AWS Lake
  Formation（S3データレイク＋Glueデータカタログに対するテーブル・列・行単位のきめ細かいアクセス許可管理）、
  AWS Elemental MediaLive（ライブ動画のリアルタイムエンコード・放送/ストリーミング配信向け変換）。
  追加トピック: AWS Lake Formation（VOCAB/PRACTICE/MOCK_POOLの3問、いずれもAWS Glue・Amazon Athena・
  AWS RAM等の隣接サービスとの違いを問う形式）、AWS Elemental MediaLive（VOCAB/PRACTICEの2問、既存source
  mediaconvertとの「ライブ対オンデマンド」の違いを明確化）、Amazon ECS（新規VOCAB初出。EKS・Fargate・ECR
  との役割分担を問うPRACTICEも追加）、Amazon EKS（既存source、VOCAB・PRACTICEいずれも今回が初出。ECSとの
  使い分け・Kubernetes標準API準拠の観点）、ハイブリッドクラウド(Hybrid Cloud)（新規VOCAB。既存の
  パブリック/プライベート/マルチクラウドの3用語に続く4つ目のデプロイモデル用語として追加。既存source
  hybridCloudを再利用し、PRACTICEでも別角度のシナリオ問題を追加）、IAM Policy Simulator（既存source、
  PRACTICE初追加。ポリシーの事前シミュレーション）、AWS Network Access Analyzer（既存source、PRACTICE新
  角度。トラフィックを送らない静的なネットワーク到達性解析）、AWS Security Incident Response（既存source、
  PRACTICE新角度。24時間365日の専門チーム支援というサブスクリプション型の性質）、AWS Verified Access
  （既存source、PRACTICE/MOCK_POOLでゼロトラストの特徴を問う複数選択・単一選択）、コスト配分タグ（既存
  source costAllocTags、PRACTICE新角度。部門別チャージバックのシナリオ）、Amazon EC2 Reserved Instance
  Marketplace（既存source riMarketplace、PRACTICE単一選択・MOCK_POOL複数選択の2問。不要になったRIの
  売却というシナリオ）、SLA (Service Level Agreement)（既存source slaLegal、PRACTICE/MOCK_POOLで
  サービスクレジットによる補償の仕組みを問う新角度）、RTO/RPO（既存source rtorpo、PRACTICEで複数選択の
  比較形式を追加）。新規出典2件（lakeFormation, medialive）はいずれも本実行環境でWebFetchが
  docs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した
  （lakeFormationはS3データレイク＋Glueデータカタログへのきめ細かいアクセス許可管理という役割を、
  medialiveはライブ動画のリアルタイム変換という役割をそれぞれ本文で確認）。VOCABの新規候補として検討した
  用語のうち、既存termリストをgrepで確認した結果「AWS Elastic Disaster Recovery (DRS)」「AWS Fault
  Injection Service (FIS)」「AWS Clean Rooms」は、末尾に略称等が付いた表記違いで実際には既にVOCABへ
  存在していたことが判明したため除外し、代わりに未出題だったAmazon ECS・ハイブリッドクラウドを採用した
  （今回の教訓: VOCABの重複チェックは正式名称の完全一致だけでなく、略称付き表記ゆれも考慮してgrepする
  必要がある）。既存の飽和気味のsource（sixAdv31件・wafReliability22件・migrationStrategies18件・
  costmgmt16件・iam15件等）は今回の新規追加の対象から意図的に避けた。正解位置は単一選択18件
  (VOCAB4・PRACTICE11・MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が4件、3が4件)、
  複数選択3件(PRACTICE2・MOCK_POOL1)は{1,3}{0,2}{0,2}の組み合わせを使用（rtorpoとriMarketplaceの2件が
  偶然同じ{0,2}になったが、出典・内容は異なる）。追加前後でvalidate_content.pyの出力・git diff・
  node(vm.runInContext)での読み込みを確認し、既存583件(VOCAB209/PRACTICE583/MOCK_POOL203)の項目は一切
  変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所の
  みで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態になっていた（`git branch --show-current`が空）が、`git checkout master`した時点でローカルの
  `master`は既に`origin/master`の最新コミット(前回記録の596/583/203件時点)と一致していたため、
  fast-forwardは不要で即座に完了した。累計 VOCAB=217, PRACTICE=609, MOCK_POOL=211（3プールとも各ドメイン
  比率は目標26/25/33/16%に近い: VOCAB tech33.6/security24.4/billing16.1/concepts25.8、PRACTICE
  concepts25.0/billing16.1/security25.3/tech33.7、MOCK_POOL concepts25.6/security25.1/tech32.2/
  billing17.1）。新規SOURCES8件を追加: Amazon GameLift Servers（セッションベースのマルチプレイヤー
  ゲーム向け専用サーバーホスティング）、Amazon Chime SDK（メッセージング・音声・ビデオ・画面共有を自社
  アプリに組み込むリアルタイム通信コンポーネント群）、Amazon Managed Service for Apache Flink（旧Amazon
  Kinesis Data Analytics for Apache Flink、ストリーム処理）、AWS Payment Cryptography（決済処理(PCI基準)
  向けの暗号機能・鍵管理、専用ペイメントHSMの調達が不要）、AWS WAF Fraud Control - Account Takeover
  Prevention (ATP)（ログインページの不正アクセス対策）、AWS WAF Fraud Control - Account Creation Fraud
  Prevention (ACFP)（サインアップページの偽アカウント対策）、Amazon CloudWatch Internet Monitor（地域・
  ISP単位でのインターネット経由の性能・可用性監視）、Amazon EC2 Capacity Reservation Fleet（複数インスタンス
  タイプへの優先順位付き容量確保、既存のCapacity Reservationとは別ページ）。追加トピック: GameLift Servers
  のマネージド型フリート対Anywhere(自己管理型)の違い、FlexMatchマッチメイキング機能(複数選択)、複数
  ロケーションにまたがるプレイスメントキュー、Chime SDKを使った通信機能の自社アプリへの組み込み、Managed
  Service for Apache FlinkとFlink Studio(ノートブック)の使い分け、CloudWatch Internet Monitorによる地域・
  ISP別の性能問題の検知、AWS Payment CryptographyとAWS KMS/CloudHSMの役割の違い(2問)、WAF Fraud Control
  ATP対ACFPの使い分け(ログイン保護対サインアップ保護、ATPはCognitoユーザープール非対応という点も含む)、
  AWS Payment Cryptographyが取得するハードウェア認定規格(PCI PTS HSM V3・FIPS 140-2 Level 3、複数選択)、
  Well-Architectedパフォーマンス効率の柱の設計原則「数分でグローバル展開する」(初出)、AWS Cloud Value
  Frameworkの「運用上の回復性」「持続可能性」の各観点(いずれも既存sourceの新角度、これで5つの価値の観点
  のうち4つに専用問題を追加。VOCABでも初導入)、Capacity Reservation Fleetの優先順位(priority)・重み
  (weight)・未使用容量の課金の仕組み(3問)。新規出典8件はすべて本実行環境でWebFetchがdocs.aws.amazon.com
  に対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。なお新規VOCAB候補として
  検討した「AWS Proton」は、WebSearchで「2026年10月7日付でサポートを終了している（新規顧客の受付は2025年
  10月7日に終了）」ことが判明し、本実行日(2026-10-14)時点で既にサポート終了日を過ぎていたため出題対象
  から除外した。「Amazon Managed Blockchain」も、2026年9月29日付で新規顧客の受付終了が発表され同年10月
  29日から新規受付停止予定であることが判明したため、サンセットが近いサービスとして出題対象から避けた。
  「AWS Private 5G」は2025年5月に提供終了済みのため除外した。「AWS Application Cost Profiler」も2024年
  9月30日付で提供終了済みのため除外した。既存の飽和気味のsource（sixAdv31件・wafReliability22件・
  migrationStrategies18件・costmgmt16件・iam15件・wafOps11件・wafSustainability9件・guardduty11件・
  drStrategies8件・wafCost10件等）は、Well-Architected各柱の設計原則一覧やDR戦略の4パターン、移行戦略の
  7R'sなどを個別にWebFetch・grepで確認した結果、いずれもほぼ全ての角度が既に出題済みであることを確認
  できたため、今回の新規追加の対象から避け、新規サービス・新規角度を優先した。正解位置は単一選択19件
  (VOCAB4・PRACTICE12・MOCK_POOL3)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、
  複数選択2件(PRACTICE1・MOCK_POOL1)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.py
  の出力・git diff・node(vm.runInContext)での読み込みを確認し、既存596/583/203件(VOCAB/PRACTICE/MOCK_POOL)
  の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを
  付与した4箇所のみで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態になっていたが（`git branch --show-current`が空）、`git checkout master`した時点でローカルの
  `master`は`origin/master`の最新コミット(前回記録の609/596/211件時点)より古い状態だったため、
  `git pull --rebase origin master`でfast-forwardして復帰した。累計 VOCAB=221, PRACTICE=622,
  MOCK_POOL=215（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech33.9/security24.4/billing16.3/concepts25.3、PRACTICE concepts24.8/billing15.8/security25.2/
  tech34.2、MOCK_POOL concepts25.1/security25.1/tech33.0/billing16.7）。新規SOURCES3件を追加: Amazon
  Kinesis Video Streams（デバイスからのライブ映像をクラウドへストリーミング・保存・インデックスする
  フルマネージド型サービス）、AWS Cloud WAN（複数リージョン・拠点をポリシーベースで宣言的に接続する
  グローバルWANサービス）、Amazon CloudWatch Synthetics（カナリアによるエンドポイントの能動的・定期的な
  死活/機能監視）。追加トピック: AWS Cloud WAN対AWS Transit Gateway(単体)の使い分け、Cloud WANの
  コアネットワークポリシー(セグメント・アタッチメントの宣言的定義、複数リージョンのコアネットワーク
  エッジの自動フルメッシュピアリング)、Amazon Kinesis Video Streams(多数デバイスからのライブ映像の
  時刻インデックス付き保存・バッチ解析、VOCAB/PRACTICE/MOCK_POOLの3問)、Amazon CloudWatch Synthetics
  (顧客不在時間帯の能動的な操作手順の再現、カナリアがLambda関数として実装されNode.js/Python/Javaで
  記述可能な点・最短1分間隔のスケジュール実行、VPC内のプライベートエンドポイント監視、複数選択含む
  PRACTICE2問/MOCK_POOL1問)、AWS Fargate(既存source、VOCAB初追加・ECSタスクとEKSポッドの両方に使える
  という既存の「EC2管理不要」angle とは異なる角度)、AWS IAM Policy Simulator(既存source、VOCAB初追加)、
  Amazon EC2 Capacity Reservation Fleet(既存source、VOCAB初追加)、Amazon Redshift Spectrum(既存source
  redshiftの新角度、S3データをロードせずRedshiftの既存テーブルと直接結合)、Amazon Rekognition Video
  とKinesis Video Streamsの統合(既存source rekognitionの新角度)、GuardDuty Runtime Monitoring(既存source
  guardduty、EKS/Fargate上のECS/EC2のOSレベル・ネットワーク・ファイルイベントの継続的な挙動監視。
  Malware Protection/S3 Protection/RDS Protection/EKS Protectionとは別の保護機能で、本ファイルでは今回が
  初出)、AWS WAF ATPのレスポンス検査(CloudFrontディストリビューション限定・非同期処理、既存source
  wafAtpの新角度)、ACFPとATPを同一Web ACLに併用する構成・両者の検査内容の違い(サインアップ時のメール
  ドメイン/電話番号/住所フィールド検証 対 ログイン時の認証情報照合、既存source wafAcfpの新角度、
  PRACTICE/MOCK_POOLの2問)、AWS Well-Architected Toolのレンズの複数適用(既存source waLensの新角度、
  複数選択)、AWS Transformの.NET Frameworkモダナイゼーション(既存source transformの新角度、マインフレーム・
  VMware移行とは異なる角度)。新規出典3件（kinesisVideo, cloudWan, cwSynthetics）はすべて本実行環境で
  WebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。
  また既存source再利用時も、特に間違えやすい事実（WAF ATP/ACFPのレスポンス検査がCloudFront限定である点、
  ACFPがCognitoユーザープールに非対応である点、Capacity Reservation Fleetの割り当て戦略は現在
  prioritizedのみサポートである点、Well-Architected Toolのレンズ数上限、AWS Transformの.NET
  モダナイゼーション機能）はWebFetch・WebSearchで公式ドキュメントを直接確認してから出題内容を作成した
  （WAF ATPのCAPTCHA/Challengeアクションの詳細な挙動は公式ページの記述のみでは断定しづらかったため、
  出題対象から除外した）。既存の飽和気味のsource（sixAdv31件・wafReliability22件・migrationStrategies18件・
  costmgmt16件・iam15件・drStrategies8件・costAnomalyDetection5件・verifiedPermissions4件・rolesAnywhere4件・
  detective5件・securityIR5件・resilienceHub5件・networkAccessAnalyzer3件・iamPolicySimulator(PRACTICE既存3件)
  ・costCategories4件・costOptimizationHub5件・costExplorer6件・consolidatedBilling6件・comprehend3件等）は、
  既出内容と重複しない具体的な未出題の事実・角度であることを個別にgrepで確認できたもの以外は今回の新規
  追加の対象から意図的に避け、新規サービス・未出題の角度を優先した。正解位置は単一選択19件
  (VOCAB4・PRACTICE11・MOCK_POOL4)を0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、
  複数選択2件(PRACTICE2件: waLensのレンズ複数適用・cwSyntheticsの実装詳細)は{0,2}と{1,3}の異なる組み合わせ
  を使用。追加前後でvalidate_content.pyの出力・git diff・node(vm.runInContext)での読み込みを確認し、既存
  217/609/211件(VOCAB/PRACTICE/MOCK_POOL)の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、`git checkout master`した時点でローカルの`master`は既に
  `origin/master`の最新コミット(前回記録のVOCAB221/PRACTICE609ではなく実際はVOCAB221/PRACTICE622/
  MOCK_POOL215。前回ログの累計値表記に誤記があったため、本行は`python3 scripts/validate_content.py`で
  実測したこの回の開始時点の値を正とする)と一致していたため、fast-forwardは不要で即座に完了した。
  追加後の累計 VOCAB=225, PRACTICE=635, MOCK_POOL=219（3プールとも各ドメイン比率は目標26/25/33/16%に
  近い: VOCAB tech33.3/security24.9/billing16.4/concepts25.3、PRACTICE concepts24.7/billing15.7/
  security25.4/tech34.2、MOCK_POOL concepts25.1/security25.1/tech32.9/billing16.9）。新規SOURCES4件を
  追加: AWS Prescriptive Guidance（移行・モダナイゼーションのノウハウを戦略/パターン/ガイドの形式で
  提供するコンテンツライブラリ）、AWS Activate（スタートアップ向けクレジット・技術サポート・トレーニング
  提供プログラム、Activate Founders対Activate Portfolio）、AWS Support App in Slack（Slackチャンネルから
  サポートケースを管理）、Amazon Interactive Video Service (IVS)（低遅延のライブ動画配信サービス）。
  追加トピック: AWS Prescriptive Guidance（VOCAB/PRACTICE/MOCK_POOLの3問、コンテンツ形式Guide/Strategy/
  Patternの区別を含む）、AWS Activate（VOCAB/PRACTICEの2問、Founders対Portfolioの違い）、AWS Support App
  in Slack（PRACTICE/MOCK_POOLの2問）、Amazon IVS（PRACTICE2問/MOCK_POOL1問、MediaLiveとの使い分け）、
  AWS Compliance Programs（既存source compliancePrograms、VOCAB初追加）、Amazon GuardDuty Malware
  Protection for S3（既存source guardduty、VOCAB初追加・PRACTICE/MOCK_POOLでEventBridge連携の隔離
  ワークフローを出題）、AWS Resilience HubとAWS Fault Injection Service (FIS)の統合（既存source
  resilienceHub、2024年12月に追加されたレジリエンス実験推奨機能という新角度）、AWS Cloud Value Frameworkの
  「コスト削減(Cost Savings)」の観点（既存source、これで5つの価値の観点すべてに専用問題を追加）、Amazon
  InspectorのCode Security機能（既存source inspector、ソースコード/依存関係/IaCスキャンという従来の
  EC2・ECR・Lambdaスキャンとは異なる新角度）、AWS IAM Identity CenterのABAC（属性ベースアクセス制御、既存
  source、SSO/許可セットとは異なる新角度）、AWS Secrets Managerのリージョン間レプリケーション（既存
  source、ローテーションとは異なる新角度、複数選択）、AWS Global Acceleratorの仕組み（既存source、Anycast
  IPの新角度）、AWS AppConfigの設定データソース（既存source、ロールバックとは異なる新角度、複数選択）。
  新規出典4件のうちAWS Support App in SlackとAWS Activateは本実行環境でWebFetchが
  docs.aws.amazon.com/aws.amazon.comに対して成功し（**今回もWebFetchが成功**）、本文を直接確認した上で
  追加した。AWS Prescriptive GuidanceとAmazon IVSはWebSearchの検索結果スニペットで確認した。AWS Activate
  は複数のAWS公式ページでクレジット上限額の記載（$100,000〜$200,000等）がばらついていたため、出題内容には
  具体的な金額を含めず、Founders(自己資金)対Portfolio(プロバイダー紹介)という安定した仕組みの違いのみを
  扱った。GuardDuty Malware Protection for S3(2024年6月一般提供開始)とInspector Code Securityの機能詳細、
  Resilience Hub×FISの統合(2024年12月)、Secrets Managerのリージョン間レプリケーションの仕様はいずれも
  WebSearchで公式ドキュメント・AWS発表記事の内容を確認してから出題した。既存の飽和気味・類似シナリオ
  過多のsource（sixAdv31件・wafReliability22件・migrationStrategies18件・costmgmt16件・iam15件・
  budgets8件・drStrategies8件・rtorpo7件・transferFamily3件・consolidatedBilling6件等）は今回の新規
  追加の対象から意図的に避け、新規サービスと、既存sourceのうち軽度の利用頻度(2〜5件)で明確に未出題の
  角度があるものを優先した。正解位置はVOCAB4件を0,1,2,3でローテーションし、PRACTICE/MOCK_POOLの単一選択
  15件は0,1,2,3でほぼ均等にローテーション(0が4件、1が4件、2が4件、3が3件)、複数選択2件(PRACTICE2件:
  Secrets Managerのレプリケーション・AppConfigの設定ソース)は{0,2}と{1,3}の異なる組み合わせを使用。
  追加前後でvalidate_content.pyの出力・git diff・node(vm.runInContext)での読み込みを確認し、既存
  VOCAB221/PRACTICE622/MOCK_POOL215件の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみで、IDの重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっていたが、ローカルの`master`は既に`origin/master`の最新コミット(3166213、前回
  記録の累計VOCAB225/PRACTICE635/MOCK_POOL219時点)と一致していたため、`git checkout master`後の
  `git pull --rebase origin master`はfast-forward不要で即座に完了した。累計 VOCAB=229, PRACTICE=648,
  MOCK_POOL=223（3プールとも各ドメイン比率は目標26/25/33/16%に近いが、今回の新規追加分がtech(新規source2件)
  に偏ったため、累計でもやや乖離: VOCAB tech33.6/security24.9/billing16.6/concepts24.9、PRACTICE
  concepts24.7/billing15.6/security25.3/tech34.4、MOCK_POOL concepts25.1/security25.1/billing16.6/
  tech33.2）。新規SOURCES2件を追加: AWS Ground Station（衛星通信をマネージドサービスとして提供、自前の
  地上局設備が不要）、AWS Elemental MediaPackage（動画のJust-In-Timeパッケージング・オリジネーション、
  DRM連携）。追加トピック: AWS Ground Station（VOCAB/PRACTICE/MOCK_POOLの3問、衛星ダウンリンクのユース
  ケース）、AWS Elemental MediaPackage（VOCAB/PRACTICE2問/MOCK_POOLの4問、MediaLive・MediaConvertとの
  役割分担、HLS/DASH複数フォーマット出力、SPEKE経由のDRM連携）、AWS WAF ATP(Account Takeover Prevention)
  のリクエスト検査(漏洩済み認証情報データベースとの照合)とレスポンス検査の制約(HTTP/3非対応・Cognito
  ユーザープール非対応、既存source wafAtpの新角度、VOCAB初追加)、AWS Network Access AnalyzerのNetwork
  Access Scope構成(MatchPaths/ExcludePaths、複数選択、既存source networkAccessAnalyzerの新角度)、AWS
  Support App in Slackのチャンネルメンバーの権限がIAMロールのポリシーに依存する点（既存source supportApp
  の新角度、VOCAB初追加）、Amazon S3ストレージクラスの最低保存期間比較(Glacier Deep Archive=180日、
  Glacier Flexible Retrieval/Instant Retrieval=90日、Standard-IA/One Zone-IA=30日、既存source s3glacier
  の新角度)、AWS DataSyncのデータ整合性検証(チェックサム・メタデータ比較、既存source datasyncの新角度)、
  Amazon Managed Service for Apache FlinkのStudioノートブック(Apache Zeppelinベース、本番アプリケーション
  への昇格機能、既存source managedFlinkの新角度)、AWS Prescriptive Guidanceの「Guide」階層の位置づけ
  (Strategy/Pattern/Guideの三層構造、既存source prescriptiveGuidanceの新角度)、AWS Service Quotasの
  「Adjustable=No」のハードリミット概念(既存source serviceQuotasの新角度)、Total Cost of Ownership(TCO)
  算出でオンプレミス側に特有の隠れたコスト要素(既存source tcoの新角度)。新規出典2件（groundStation,
  mediaPackage）はいずれも本実行環境でWebFetchがdocs.aws.amazon.comに対して成功し（**今回もWebFetchが
  成功**）、本文を直接確認した上で追加した。既存source再利用時も、WAF ATPのリクエスト/レスポンス検査の
  仕組み、Network Access Scopeの構成要素、S3ストレージクラスの最低保存期間、DataSyncの整合性検証方式、
  Managed Service for Apache Flink Studioノートブックの仕様、AWS Prescriptive Guidanceの三層構造、
  AWS Service Quotasのハードリミット概念はすべてWebFetch/WebSearchで公式ドキュメントの記述を個別に確認
  してから出題内容を作成した。なお新規VOCAB候補として検討した「AWS App2Container」「AWS Mainframe
  Modernization」は、WebFetchで確認した結果いずれも2025年11月7日付で新規顧客の受付を終了していることが
  判明したため、既存の除外事例（QLDB・Migration Hub・Pinpoint等）と同様の理由で出題対象から除外し、代わりに
  AWS Ground StationとAWS Elemental MediaPackageを採用した。AWS Activate・AWS Data Exportsについても
  新角度の候補（クレジットの併用制限、エクスポート頻度）を検討したが、WebSearchで公式ドキュメントから
  確実な裏付けが取れなかったため出題を見送った。既存の飽和気味のsource（sixAdv31件・wafReliability22件・
  migrationStrategies18件・costmgmt16件・iam15件・guardduty15件・organizations12件・ec2Ri11件等）は今回の
  新規追加の対象から意図的に避けた。正解位置は単一選択19件(VOCAB4・PRACTICE11・MOCK_POOL4)を0,1,2,3で
  ほぼ均等にローテーション(0が5件、1が5件、2が5件、3が4件)、複数選択2件(PRACTICE2件: Network Access
  Scope構成・MediaPackageの特徴)は{0,2}と{1,3}の異なる組み合わせを使用。追加前後でvalidate_content.pyの
  出力・git diff・node(vm.runInContext)での読み込みを確認し、既存635/622/219件(VOCAB/PRACTICE/MOCK_POOL)
  の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを
  付与した4箇所のみで、IDの重複も無し）を確認済み。1件のみ実装上のミスがあり、PRACTICE単一選択の
  correct フィールドを当初`correct:N`という整数形式で書いてしまい(validate_content.pyがPRACTICE/MOCK_POOL
  では`correct:[N]`という配列形式を前提としているため)検証エラーとなったが、該当11件を`correct:[N]`形式に
  修正してから再検証・コミットした（次回以降の実行でも、PRACTICE/MOCK_POOLのtype:'single'は
  `correct:[N]`という配列形式で書く必要がある点に注意）。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスが`master`から
  detached HEADの状態になっており、かつそのdetached HEAD(c43c346)はローカルの`master`ブランチより34コミット
  進んでいたが、`git fetch origin master`で確認したところ`origin/master`も同じc43c346を指していた（過去の
  複数回の実行がコミット・pushまでは完了していたが、ローカル`master`ブランチへの反映だけが漏れていた状態）。
  `git checkout master && git merge --ff-only origin/master`でfast-forwardして復旧し、
  `python3 scripts/validate_content.py`で開始時点がVOCAB229/PRACTICE648/MOCK_POOL223であることを確認して
  から新規追加作業を開始した。追加後の累計 VOCAB=233, PRACTICE=661, MOCK_POOL=227（3プールとも各ドメイン
  比率は目標26/25/33/16%に近い: VOCAB tech33.5/security24.9/billing16.7/concepts24.9、PRACTICE
  concepts24.7/billing15.6/security25.3/tech34.5、MOCK_POOL concepts25.1/security25.1/tech33.0/billing16.7）。
  新規SOURCES7件を追加: AWS Glue DataBrew（コードを書かない視覚的なデータ準備ツール）、Amazon Comprehend
  Medical（臨床テキストのNLP、ICD-10-CM/RxNormへのオントロジーリンク）、Amazon CloudWatch RUM（実ユーザー
  のクライアント側パフォーマンス監視）、Amazon S3 Object Lock（WORMモデル、Governance/Complianceモード）、
  AWS Purchase Order Management（Billing and Cost Managementコンソールの購入注文セルフサービス管理、2026年
  初頭にプレビュー公開された比較的新しい機能）、AWS Sustainability コンソール（2026年3月に新設された、
  Customer Carbon Footprint Tool (CCFT)の後継となる炭素排出量可視化のスタンドアロンサービス。CCFTはWebSearch
  で確認した時点で2026年6月30日付での廃止が予定されていることが判明したため、CCFT自体は新規出題の対象とせず、
  後継のSustainability コンソールを採用した）、Amazon EC2 インスタンスメタデータサービス(IMDSv2)（PUTリクエスト
  によるセッショントークンを用いたセキュアなメタデータ取得方式、SSRF等への多層防御）。追加トピック: 上記7件の
  新規サービス・機能について、VOCAB4件(各ドメイン1件ずつ)・PRACTICE11件(複数角度)・MOCK_POOL4件を作成した
  ほか、既存の軽度利用のsource（appstream=Amazon WorkSpaces Applicationsのフリートタイプ比較、fis=実験
  テンプレートの構成要素、waLens=カスタムレンズ、dataExports=5種類のエクスポート形式)を新角度で2件
  (PRACTICE)再利用した。新規出典7件はすべて本実行環境でWebFetchがdocs.aws.amazon.com/aws.amazon.comに対して
  成功し（**今回もWebFetchが成功**）、本文を直接確認した上で追加した。AWS Purchase Order Managementの
  ライン品目タイプの照合ロジック、AWS Sustainability コンソールのCCFT廃止時期・MBM/LBM算出方式、IMDSv2の
  トークン発行の仕組みはいずれも公式ドキュメントの記述を直接確認してから出題内容を作成した。既存の飽和気味の
  source（sixAdv31件・wafReliability22件・migrationStrategies18件・costmgmt16件・iam15件・guardduty15件・
  accessAnalyzer9件・kms9件・networkAccessAnalyzer4件・securityIR5件・inspector5件・detective5件等）は今回の
  新規追加・再利用の対象から意図的に避けた。正解位置は単一選択18件(VOCAB4・PRACTICE11・MOCK_POOL3)を
  0,1,2,3でほぼ均等にローテーション(0が5件、1が5件、2が4件、3が4件)、複数選択3件(PRACTICE2件・MOCK_POOL1件)
  は{0,2}{1,3}{0,3}の3通りの異なる組み合わせを使用。追加前後でvalidate_content.pyの出力・git diff・
  node(vm.runInContext)での読み込みを確認し、既存229/648/223件(VOCAB/PRACTICE/MOCK_POOL)の項目は一切変更して
  いないこと（diffはSOURCES/VOCAB/PRACTICE/MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみで、IDの
  重複も無し）を確認済み。
- 2026-10-14: 定期実行で21件追加（VOCAB+4/PRACTICE+13/MOCK_POOL+4）。開始時、サンドボックスがdetached HEAD
  の状態になっていたため、`git checkout master && git pull --rebase origin master`で復帰してから作業した
  （fast-forward不要でローカル`master`は既に`origin/master`の最新コミットと一致していた）。開始時点で
  VOCAB233/PRACTICE661/MOCK_POOL227であることを確認してから新規追加を開始した。追加後の累計
  VOCAB=237, PRACTICE=674, MOCK_POOL=231（3プールとも各ドメイン比率は目標26/25/33/16%に近い: VOCAB
  tech33.3/security24.9/billing16.9/concepts24.9、PRACTICE concepts24.8/billing15.9/security25.2/tech34.1、
  MOCK_POOL concepts25.5/security25.1/tech32.5/billing16.9）。新規SOURCES2件を追加: Amazon CloudWatch
  Application Signals（アプリケーションの自動計装・依存関係マップ・SLO追跡機能）、Amazon EC2 Capacity
  Blocks for ML（将来日程のGPU容量事前予約）。追加トピック: 上記2件の新規サービスについてVOCAB2件・
  PRACTICE7件・MOCK_POOL1件を作成したほか、既存source（migrationStrategies=Repurchase/Relocateの
  VOCAB初追加とReplatform対Repurchase・Relocate対Rehostの比較設問、prescriptiveGuidance=Strategy階層の
  位置づけ、waLens=レンズカタログに含まれる業界別レンズ、riMarketplace=買い手視点でのメリット、
  s3ObjectLock=ガバナンスモード対コンプライアンスモードの違い、backup=Vault Lockとそのクーリングオフ期間、
  imdsv2=メタデータ不要時の無効化設定）を新角度で再利用した（事前に各sourceの既存設問テキストをgrepで
  確認し重複がないことを確認済み）。検討したが見送った候補: Amazon DevOps Guruは新規SOURCES候補として
  WebFetchで本文を確認したところ、2026年10月29日付で新規顧客の受付を終了し2027年9月30日にサービス終了
  予定であることが判明したため、既存の除外事例（App Runner・Proton・WorkMail等）と同様の理由で出題対象
  から除外し、代わりにCloudWatch Application Signalsを採用した。AWS Supply Chainおよびprescriptive-guidance
  のMigration Readiness Assessment関連ページはWebFetchを試みたがいずれも404となり本文の直接確認ができな
  かったため、確認できた情報の範囲にとどめる方針から新規追加は見送った。新規出典2件のうちCloudWatch
  Application SignalsはWebFetchがdocs.aws.amazon.comに対して成功し本文を直接確認できた（**今回はWebFetch
  が一部成功**）。Capacity Blocks for MLはWebFetchが404となったため、WebSearchの複数の検索結果スニペット
  (docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-blocks.html 等の一致を複数確認)で内容を確認する
  フォールバックを使用した。AWS Backup Vault LockおよびAWS WAF ACFPのPassword pairing protection機能については
  WebSearchで事実確認を行い、後者は公式ドキュメントでの用語の一致が確認できなかったため出題を見送った。
  既存の飽和気味のsource（sixAdv31件・wafReliability22件・migrationStrategies18件(VOCAB初追加分を除く)・
  costmgmt16件・iam15件・guardduty15件・organizations12件・ec2Ri11件・wafOps11件等）は今回の新規追加・
  再利用の対象から意図的に避けた。正解位置は単一選択18件(VOCAB4・PRACTICE11・MOCK_POOL3)を0,1,2,3で
  ほぼ均等にローテーション(0が5件、1が5件、2が5件、3が3件)、複数選択3件(PRACTICE2件・MOCK_POOL1件)は
  {0,2}{1,3}{0,2}の組み合わせを使用。追加前後でvalidate_content.pyの出力・git diff・node(vm.runInContext)
  での読み込みを確認し、既存233/
  661/227件(VOCAB/PRACTICE/MOCK_POOL)の項目は一切変更していないこと（diffはSOURCES/VOCAB/PRACTICE/
  MOCK_POOLそれぞれの末尾項目にカンマを付与した4箇所のみで、IDの重複も無し）を確認済み。
