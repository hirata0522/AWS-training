(function(){
'use strict';

// AIF-C01 (AWS Certified AI Practitioner) のコンテンツ。
// 構造は js/data/clf-c02.js と同じ。アプリへの組み込み（index.htmlでの読み込み・変数名の扱い）は未実装。
// 出題比率: aiml 20% / genai 24% / fm 28% / responsible 14% / security 14%（試験ガイド v1.1）
var DOMAINS = {
  aiml:'AIと機械学習の基礎',
  genai:'生成AIの基礎',
  fm:'基盤モデルの応用',
  responsible:'責任あるAIのガイドライン',
  security:'AIソリューションのセキュリティ、コンプライアンス、ガバナンス'
};

// 出典（AWS公式ドキュメント・公式ページ）。各単語・問題の source フィールドから参照する。
var SOURCES = {
  examGuide:{label:'AWS Certified AI Practitioner (AIF-C01) 試験ガイド', url:'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/ai-practitioner-01.html'},
  examInScope:{label:'AIF-C01 対象のAWSサービス', url:'https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01/aif-01-in-scope-services.html'},
  bedrock:{label:'Amazon Bedrock', url:'https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html'},
  sagemakerAi:{label:'Amazon SageMaker AI', url:'https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html'},
  mlWorkflow:{label:'SageMaker AI: 機械学習の概要（一般的なMLワークフロー）', url:'https://docs.aws.amazon.com/sagemaker/latest/dg/how-it-works-mlconcepts.html'},
  awsOverviewMl:{label:'AWSの概要: 機械学習(ML)と人工知能(AI)', url:'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/machine-learning.html'},
  whatIsAi:{label:'AWS: 人工知能(AI)とは', url:'https://aws.amazon.com/what-is/artificial-intelligence/'},
  whatIsGenai:{label:'AWS: 生成AIとは', url:'https://aws.amazon.com/what-is/generative-ai/'},
  bedrockInference:{label:'Amazon Bedrock: 推論パラメータによる応答の制御', url:'https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html'},
  responsibleAi:{label:'AWS: 責任あるAI', url:'https://aws.amazon.com/ai/responsible-ai/'},
  sharedResp:{label:'AWS 責任共有モデル', url:'https://aws.amazon.com/compliance/shared-responsibility-model/'},
  whatIsMl:{label:'AWS: 機械学習(ML)とは', url:'https://aws.amazon.com/what-is/machine-learning/'},
  whatIsNn:{label:'AWS: ニューラルネットワークとは', url:'https://aws.amazon.com/what-is/neural-network/'},
  whatIsLlm:{label:'AWS: 大規模言語モデル(LLM)とは', url:'https://aws.amazon.com/what-is/large-language-model/'},
  iamRoles:{label:'IAM ロール', url:'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html'}
};

var VOCAB = [
  {id:'v1', term:'Amazon Bedrock', domain:'genai', source:SOURCES.bedrock, q:{text:'Amazon Bedrockとは何ですか？', choices:['自社データで独自の機械学習モデルを構築・学習・デプロイするための統合開発環境','テキストから感情やエンティティを抽出する自然言語処理サービス','複数の企業の基盤モデルにAPI経由でアクセスできるフルマネージドサービス','音声をテキストに変換する自動音声認識サービス'], correct:2, why:['これはAmazon SageMaker AIの説明です。Bedrockは自分でモデルを一から学習させるのではなく、既存の基盤モデルを利用・カスタマイズするサービスです。','これはAmazon Comprehendの説明です。','正しい。Amazon Bedrockは、Amazon・Anthropicなど複数のプロバイダーの基盤モデル(FM)にAPIでアクセスし、生成AIアプリケーションを構築できるフルマネージドサービスです。','これはAmazon Transcribeの説明です。']}},
  {id:'v2', term:'Amazon SageMaker AI', domain:'aiml', source:SOURCES.sagemakerAi, q:{text:'Amazon SageMaker AIとは何ですか？', choices:['機械学習モデルの構築・トレーニング・デプロイを行うマネージドサービス','基盤モデルをAPIで呼び出すことに特化したサーバーレスの生成AIサービス','画像や動画から物体・顔・テキストを検出する画像分析サービス','文書をスキャンしてテキストや表・フォームのデータを抽出するサービス'], correct:0, why:['正しい。SageMaker AI（2024年12月にAmazon SageMakerから改称）は、MLモデルの構築・トレーニング・本番環境へのデプロイをマネージドで行えるサービスです。','これはAmazon Bedrockの説明です。','これはAmazon Rekognitionの説明です。','これはAmazon Textractの説明です。']}},
  {id:'v3', term:'Artificial Intelligence (AI)', domain:'aiml', source:SOURCES.whatIsAi, q:{text:'Artificial Intelligence (AI)の説明として最も適切なものはどれですか？', choices:['多層のニューラルネットワークを使い、特徴量を自動で学習する手法に限定した用語で、機械学習やルールベースの手法を含まない独立した分野を指す','機械をより人間らしく振る舞わせるためのさまざまな手法や技術を包括する広い概念','新しいテキストや画像などのコンテンツを生成することに特化した技術のこと','大量のデータを保存・検索するためのデータベース技術全般'], correct:1, why:['これはディープラーニングの説明です。AIはより広い概念で、ディープラーニングはその一部です。','過去のデータからパターンを見つけて予測する手法だけを指す、機械学習と同じ意味の用語','これは生成AIの説明です。生成AIはAIの一分野です。','AIはデータの保存技術ではありません。']}},
  {id:'v4', term:'Generative AI (GenAI)', domain:'genai', source:SOURCES.whatIsGenai, q:{text:'Generative AI (GenAI)とは何ですか？', choices:['既存のデータを分類して、決められたラベルのいずれかを返すことに特化したAI','ルールを人手で記述して固定の応答を返すだけのチャットボット','会話・物語・画像・動画・音楽などの新しいコンテンツを作り出せるAI','ストレージ上のデータを自動でバックアップする仕組み'], correct:2, why:['分類（識別）に特化したモデルは従来型の識別系MLの特徴で、新しいコンテンツを作る生成AIとは異なります。','ルールベースのボットは新しいコンテンツを生成しません。','学習した内容を再利用して新しいコンテンツを作り出せる点が特徴です。','AIとは無関係の説明です。']}},
  {id:'v5', term:'Temperature', domain:'fm', source:SOURCES.bedrockInference, q:{text:'基盤モデルの推論パラメータ「temperature」を高く設定すると、どうなりますか？', choices:['確率の高いトークンが選ばれやすくなり、応答がより決定的になるため、同じ入力に対する応答のばらつきがほとんどなくなる','応答の最大トークン数が増える','モデルが応答を停止する文字列が変わる','確率の低いトークンが選ばれやすくなり、応答がよりランダムで多様になる'], correct:3, why:['これはtemperatureを低くした場合の挙動です。','応答の長さを制限するのは最大トークン数（response length）などの長さ系パラメータです。','応答を止める文字列はstop sequencesで指定します。','正しい。temperatureは次のトークンの確率分布の形を変え、高いほど分布が平坦になって低確率のトークンも選ばれやすくなります。']}},
  {id:'v6', term:'Responsible AI', domain:'responsible', source:SOURCES.responsibleAi, q:{text:'AWSが「責任あるAI」を評価するための中核的な考え方として、正しいものはどれですか？', choices:['公平性・説明可能性・安全性・透明性などの複数の観点（dimensions）でAIシステムを評価する','モデルの推論速度だけを最優先に評価する','利用コストの削減だけを目的に最適化する','モデルの学習データを非公開にすることだけを求める'], correct:0, why:['AWSは公平性、説明可能性、プライバシーとセキュリティ、安全性、制御可能性、検証可能性と堅牢性、ガバナンス、透明性の8つの観点で定義しています。','速度は性能面の指標で、責任あるAIの観点そのものではありません。','コストは重要ですが、責任あるAIの観点ではありません。','データの扱いはプライバシーとセキュリティの観点の一部にすぎず、それだけではありません。']}},
  {id:'v7', term:'AWS Shared Responsibility Model', domain:'security', source:SOURCES.sharedResp, q:{text:'AWS責任共有モデルの考え方として正しいものはどれですか？', choices:['AWSがお客様のデータとIAM権限を含むすべてのセキュリティを担うため、お客様側では利用するサービスの設定を一切確認する必要がない','AWSはクラウド自体のインフラを保護し、お客様は利用するサービスに応じて自分のデータや設定などを保護する','お客様がデータセンターの物理的なセキュリティを管理する','責任の分担はサービスによらず常に完全に同じである'], correct:1, why:['データやIAM権限の管理はお客様の責任です。','正しい。AWSはハードウェア・ソフトウェア・ネットワーク・施設を保護し、お客様はデータ・暗号化設定・IAM権限などを管理します。','物理施設の保護はAWSの責任です。','お客様の責任範囲は利用するサービスによって異なります。']}},
  {id:'v8', term:'Machine Learning (ML)', domain:'aiml', source:SOURCES.whatIsMl, q:{text:'Machine Learning (ML)の説明として正しいものはどれですか？', choices:['人間が全ての条件分岐を手作業でプログラムして処理を決定する手法で、データからパターンを学習する仕組みを一切持たない従来型の処理方式','データを暗号化して安全に保管するための手法','明示的な指示がなくても、過去のデータからパターンを見つけて新しいデータを分類・予測するAIの手法','新しい画像や音楽などのコンテンツを生成することだけに特化した手法'], correct:2, why:['これは従来のルールベースのプログラミングです。','暗号化はセキュリティ技術で、MLの説明ではありません。','正しい。MLはデータからパターンを学習して、新しいデータに対する分類や予測を行います。','これは生成AIの説明で、MLの定義より狭い内容です。']}},
  {id:'v9', term:'Top-p', domain:'fm', source:SOURCES.bedrockInference, q:{text:'推論パラメータ「Top P」の説明として正しいものはどれですか？', choices:['確率の高い順に固定個数（K個）の候補だけから次のトークンを選ぶ方式で、候補の個数は常に固定されトークンごとに変わらない','応答に含める最大のトークン数を指定する','応答の生成を止める文字列を指定する','累積確率の上位P%に入る候補だけから次のトークンを選ぶ'], correct:3, why:['これはTop Kの説明です。Top Pは累積確率で範囲を決めるため候補数がトークンごとに変わります。','最大トークン数（response length）の説明です。','これはstop sequencesの説明です。','Top Pを低くすると候補が減り、高くすると低確率のトークンも候補に入ります。']}},
  {id:'v10', term:'Security of the Cloud vs Security in the Cloud', domain:'security', source:SOURCES.sharedResp, q:{text:'責任共有モデルにおける「クラウドのセキュリティ（security of the cloud）」を担うのはどちらですか？', choices:['AWSが、クラウドを動かすハードウェア・ソフトウェア・ネットワーク・施設を保護する','お客様が、自社で保存するデータや暗号化設定を保護する責任であり、利用するサービスの種類によってその範囲が変わることもない','お客様が、データセンターの電源設備と物理的な入退室管理を保護する','お客様とAWSがインフラの保護を毎回半分ずつ分け合う'], correct:0, why:['正しい。security "of" the cloudはAWSの責任です。','これは「クラウド内のセキュリティ（security in the cloud）」でお客様の責任です。','物理施設はAWSの責任範囲です。','責任はこのように半分ずつと決まっているわけではなく、「of」と「in」で分かれます。']}},
  {id:'v11', term:'Large Language Model (LLM)', domain:'genai', source:SOURCES.whatIsLlm, q:{text:'Large Language Model (LLM)の説明として最も適切なものはどれですか？', choices:['特定の1つの分類タスク専用に少量のデータで学習された小さな決定木モデルで、複数の言語タスクをこなす用途には使えず、事前学習も行わない','大量のデータで事前学習された非常に大規模なディープラーニングモデルで、要約・質問応答・翻訳などの言語タスクをこなす','画像の中の物体を検出することだけに特化したコンピュータビジョンモデル','テキストを音声に変換して読み上げるための音声合成サービス'], correct:1, why:['LLMは大規模で汎用的なモデルであり、小さな専用モデルではありません。','LLMはトランスフォーマーのニューラルネットワークに基づき、1つのモデルで多様な言語タスクを処理できます。','LLMは言語を扱うモデルです。画像検出に特化したものではありません。','これはAmazon Pollyのようなサービスの説明です。']}},
  {id:'v12', term:'Deep Learning', domain:'aiml', source:SOURCES.whatIsNn, q:{text:'ディープラーニングの説明として正しいものはどれですか？', choices:['人間が特徴量を設計して決定木で学習する、機械学習とは別系統の手法で、隠れ層を持つネットワークは使わず、生データから特徴を自動で学ぶこともない','ラベルなしデータのグループ分けだけを行う手法','機械学習の一種で、多数の隠れ層を持つニューラルネットワークを使い、生データから特徴を自動で学習する','モデルの学習データを暗号化して保存する手法'], correct:2, why:['ディープラーニングは特徴を自動で学習する点が特徴で、人手の特徴量設計を前提としません。','これは教師なし学習の説明で、ディープラーニングの定義ではありません。','正しい。人手で特徴を設計しなくても、複雑な非構造化データ（画像・テキスト）に向いています。','セキュリティ技術の説明でディープラーニングではありません。']}},
  {id:'v13', term:'Fairness', domain:'responsible', source:SOURCES.responsibleAi, q:{text:'責任あるAIの観点における「公平性（Fairness）」の説明として最も適切なものはどれですか？', choices:['モデルの出力の根拠を人が理解できるようにすることことを重視する観点で、関係者への影響の違いを考慮することとは別の観点','不適切な出力や悪用を防ぐこと','AIの挙動を監視し、必要に応じて制御できること','AIシステムが異なるグループの関係者に与える影響を考慮すること'], correct:3, why:['これは説明可能性（Explainability）の観点です。','これは安全性（Safety）の観点です。','これは制御可能性（Controllability）の観点です。','AWSは公平性を「異なるステークホルダーのグループへの影響を考慮すること」と位置付けています。']}},
  {id:'v14', term:'Top-k', domain:'fm', source:SOURCES.bedrockInference, q:{text:'推論パラメータ「Top K」を50に設定した場合の動作として正しいものはどれですか？', choices:['次のトークンとして、確率が高い上位50個の候補から選ぶ','累積確率が上位50%に入る候補だけから選ぶ方式で、候補の個数は確率分布の形に応じて毎回変わる','応答の最大長を50トークンに制限する','生成中に「50」という文字列が出たら応答を停止する'], correct:0, why:['Top Kは候補の個数を固定で絞ります。低いほど候補が減り、高いほど低確率のトークンも対象になります。','これはTop Pの考え方です。Top Kは個数で絞ります。','応答の長さはresponse lengthなどで制限します。','これはstop sequencesの考え方です。']}},
  {id:'v15', term:'AWS Identity and Access Management (IAM)', domain:'security', source:SOURCES.iamRoles, q:{text:'AWS Identity and Access Management (IAM)の役割として正しいものはどれですか？', choices:['機密データをS3内から自動で検出して分類する','AWSリソースへのアクセスを、誰が何に対して何をできるかというポリシーで制御する','AWS APIの呼び出し履歴を記録して監査に使う','データを保存時に暗号化するための鍵を作成・管理する'], correct:1, why:['これはAmazon Macieの役割です。','IAMはユーザー・ロール・ポリシーでAWSリソースへの認証と認可を管理します。','これはAWS CloudTrailの役割です。','これはAWS KMSの役割です。']}},
  {id:'v16', term:'Neural Network', domain:'aiml', source:SOURCES.whatIsNn, q:{text:'ニューラルネットワークの説明として正しいものはどれですか？', choices:['保存データを複数のサーバーにレプリケートするための分散ストレージ技術','ネットワークの通信量を監視して異常を検知するセキュリティ機能で、層状のノードや誤差からのフィードバックによる学習とは無関係な仕組み','脳を緩やかに模した、相互に接続された層状のノード（ニューロン）から成り、誤差からのフィードバックで調整されながら学習する機械学習の手法','人手で書いたif文の規則を順に評価して結果を決めるプログラム'], correct:2, why:['これはストレージの技術で、ニューラルネットワークではありません。','これはネットワーク監視の説明でニューラルネットワークとは異なります。','ノードの層が重みを調整しながら学習します。隠れ層が多いものがディープラーニングです。','これはルールベースの処理で、データから学習する仕組みではありません。']}},
  {id:'v17', term:'Foundation Model (FM)', domain:'genai', source:SOURCES.whatIsGenai, q:{text:'基盤モデル（Foundation Model）の説明として最も適切なものはどれですか？', choices:['特定の1つの業務だけのために、少量のデータで専用に学習した小さなモデルで、さまざまなタスクに共通して使うことは想定されていない','機械学習モデルの学習ジョブを実行するためのコンピューティングインスタンス','モデルの学習データを保存するための共通のデータレイク','幅広いテキストや画像のデータで学習された大規模なモデルで、質問応答・文章作成・画像のキャプション生成など多くの汎用タスクをこなせる'], correct:3, why:['基盤モデルは汎用的な大規模モデルです。','これは学習用のインフラの説明で、モデルそのものではありません。','データレイクはデータの置き場で、基盤モデルではありません。','基盤モデルは1つの用途に限らず、さまざまなタスクに適用できる大規模モデルです。']}},
  {id:'v18', term:'Algorithm', domain:'aiml', source:SOURCES.whatIsMl, q:{text:'機械学習における「アルゴリズム」と「モデル」の関係として正しいものはどれですか？', choices:['アルゴリズムを使ってデータで学習（トレーニング）し、パラメータが調整された結果がモデルになる','モデルが先にあり、アルゴリズムはモデルを使った推論の結果のことである','アルゴリズムとモデルは同じものを指し、区別されない','モデルはデータを持たず、アルゴリズムだけが予測に使われる'], correct:0, why:['トレーニングで調整された関数が学習済みモデルとなり、新しい入力の予測に使われます。','推論の結果はアルゴリズムではありません。学習方法がアルゴリズム、学習結果がモデルです。','学習の手順（アルゴリズム）と学習の結果（モデル）は区別されます。','予測に使われるのは学習済みのモデルです。']}},
  {id:'v19', term:'Maximum Tokens', domain:'fm', source:SOURCES.bedrockInference, q:{text:'推論パラメータで応答の最大トークン数（最大長）を小さくすると、どうなりますか？', choices:['確率の低いトークンが選ばれやすくなる','モデルが生成する応答の長さの上限が下がり、長い応答が途中で打ち切られることがある','モデルが考慮する候補トークンの数が減るようになり、応答の長さの上限そのものは変わらず同じままになる','特定の文字列が生成されたら応答が止まる'], correct:1, why:['これはtemperatureを高くした場合などの挙動です。','応答の長さを制限するパラメータで、指定したトークン数を超えて生成しません。','これはTop Kなどの候補を絞るパラメータの動作です。','これはstop sequencesの動作です。']}},
  {id:'v20', term:'IAM Role', domain:'security', source:SOURCES.iamRoles, q:{text:'IAMロールの説明として正しいものはどれですか？', choices:['1人の人に固定され、パスワードや長期のアクセスキーを持つIAMアイデンティティで、必要な主体が引き受けて一時的に使うことは想定されていない','IAMポリシーを使わずにすべてのリソースへのフルアクセスを与える仕組み','特定の人に固定されず、必要な主体が引き受けて一時的な認証情報を得るIAMアイデンティティ','複数のIAMユーザーをまとめて同じポリシーを付与するための単位'], correct:2, why:['これはIAMユーザーの説明です。','ロールにも権限ポリシーが付き、許可された範囲のみ操作できます。','ロールにはパスワードやアクセスキーのような長期の認証情報がなく、引き受けると一時的な認証情報が発行されます。','これはIAMグループの説明です。']}},
  {id:'v21', term:'Model', domain:'aiml', source:SOURCES.whatIsMl, q:{text:'機械学習における「モデル」の説明として正しいものはどれですか？', choices:['学習に使うための元データ全体を保存した倉庫で、トレーニング後に得られるパラメータや予測の仕組みを含まない','学習の手順を記述した、実行前のアルゴリズムそのもの','モデルの精度を人が手作業で採点した結果の一覧','トレーニングによってパラメータが調整された学習済みの関数で、新しい入力に対して予測を出力するもの'], correct:3, why:['これは学習データ（データセット）の説明です。','学習の手順がアルゴリズムで、学習結果がモデルです。','これは評価結果の説明でモデルではありません。','アルゴリズムがデータで学習した結果がモデルで、新しいデータに対する推論に使います。']}}
];

var PRACTICE = [
  {id:'p1', domain:'genai', type:'single', source:SOURCES.bedrock, text:'ある企業が、サーバーやモデルの管理をせずに、複数プロバイダーの基盤モデルをAPI経由で使って社内向けの生成AIチャットアプリを構築したいと考えています。最も適したAWSサービスはどれですか？',
    choices:['Amazon SageMaker AI','Amazon Comprehend','Amazon Lex','Amazon Bedrock'], correct:[3],
    why:['SageMaker AIはMLモデルの構築・学習・デプロイ全般のためのサービスで、インフラやモデルのライフサイクル管理の比重が大きく、「管理せずに複数社の基盤モデルをAPIで使う」要件にはBedrockの方が適しています。','Comprehendはテキストの感情分析・エンティティ抽出などを行う自然言語処理サービスで、生成AIの基盤モデルを選んで使うサービスではありません。','Lexは音声・テキストの会話インターフェイス（チャットボット）を構築するサービスで、複数プロバイダーの基盤モデルへのアクセスを提供するものではありません。','正しい。Amazon Bedrockは複数プロバイダーの基盤モデルにAPIでアクセスでき、インフラ管理なしで生成AIアプリを構築できるフルマネージドサービスです。']},
  {id:'p2', domain:'aiml', type:'multi', source:SOURCES.sagemakerAi, text:'Amazon SageMaker AIの説明として正しいものはどれですか？（2つ選択）',
    choices:['テキストから感情やキーフレーズを抽出する事前学習済みのNLP専用APIである','MLモデルの構築・トレーニング・デプロイをマネージド環境で行える','基盤モデルの呼び出し専用で、独自モデルのトレーニングには対応していない','2024年12月にAmazon SageMakerから名称が変更された'], correct:[1,3],
    why:['これはAmazon Comprehendの説明です。','正しい。SageMaker AIは、データサイエンティストや開発者がMLモデルを構築・トレーニングし、本番環境にデプロイするためのフルマネージドサービスです。','誤り。SageMaker AIは独自のアルゴリズムやフレームワークによるトレーニングにも対応しています。基盤モデルのAPI利用が中心なのはAmazon Bedrockです。','正しい。2024年12月3日にAmazon SageMakerはAmazon SageMaker AIに改称されました（APIの名前空間などは互換性のため`sagemaker`のまま）。']},
  {id:'p3', domain:'aiml', type:'ordering', source:SOURCES.mlWorkflow, text:'一般的な機械学習(ML)ワークフローの手順を、最初に行うものから順に並べてください。',
    items:['データを収集・取得する','データをクリーニング・前処理する','モデルをトレーニングする','モデルを評価する','モデルをデプロイする'],
    why:['最初にモデルの学習に必要なサンプルデータを社内リポジトリや公開データセットから集めます。','集めたデータは表記ゆれの修正や変換などのクリーニング・前処理をしてから学習に使います。','前処理済みのデータとアルゴリズム（または事前学習済みモデル）を使ってモデルをトレーニングします。','トレーニング後、推論の精度が許容できるかを評価します。','評価で問題がなければモデルをデプロイして推論に使います。デプロイ後も監視とデータ追加による再トレーニングを繰り返します。']},
  {id:'p4', domain:'aiml', type:'matching', source:SOURCES.awsOverviewMl, text:'それぞれのユースケースに最も適したAWSのAIサービスを選んでください。',
    prompts:['カスタマーレビューの文章が肯定的か否定的かを判定したい','スキャンした申込書から記入欄の値と表のデータを抽出したい','コールセンターの通話録音をテキストに変換したい','ニュース記事を自然な音声で読み上げたい'],
    options:['Amazon Polly','Amazon Comprehend','Amazon Translate','Amazon Transcribe','Amazon Textract'], correct:[1,4,3,0],
    why:['Amazon Comprehendは自然言語処理(NLP)でテキストの感情（肯定的・否定的）やキーフレーズを分析します。','Amazon TextractはOCRを超えて、スキャン文書のフォームの項目値や表のデータまで抽出します。','Amazon Transcribeは音声をテキストに変換する自動音声認識(ASR)サービスです。','Amazon Pollyはテキストを自然な音声に変換する音声合成サービスです。（Amazon Translateは言語間の翻訳で、どのユースケースにも当てはまりません）']}
];

var MOCK_POOL = [
  {id:'m1', domain:'aiml', type:'single', source:SOURCES.sagemakerAi, text:'データサイエンティストのチームが、自社の表形式データを使って独自の予測モデルをトレーニングし、推論用のエンドポイントとしてデプロイしたいと考えています。最も適したAWSサービスはどれですか？',
    choices:['Amazon Bedrock','Amazon SageMaker AI','Amazon Personalize','Amazon Textract'], correct:[1],
    why:['Bedrockは既存の基盤モデルを利用・カスタマイズして生成AIアプリを作るサービスで、表形式データから独自の予測モデルを一から学習させる用途には向きません。','正しい。SageMaker AIはMLモデルの構築・トレーニング・デプロイをマネージドで行えるため、独自モデルの学習とエンドポイント公開の要件に合致します。','Personalizeはレコメンデーション（パーソナライズ）に特化したマネージドサービスで、汎用的な予測モデルの学習・デプロイには使いません。','Textractは文書からテキストや表・フォームを抽出するサービスで、モデルのトレーニング基盤ではありません。']}
];

// 試験として登録する（アプリは window.EXAMS から読み込む。上の var は即時関数内のローカル変数）
(window.EXAMS = window.EXAMS || {})['aif-c01'] = {
  code:'AIF-C01', name:'AI Practitioner',
  mock:{questions:65, minutes:90}, // 本番の出題数・試験時間
  DOMAINS:DOMAINS, SOURCES:SOURCES, VOCAB:VOCAB, PRACTICE:PRACTICE, MOCK_POOL:MOCK_POOL
};
})();
