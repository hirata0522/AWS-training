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

0. **作業前に必ず** `git pull --rebase` を実行し、最新状態から始めること。
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
