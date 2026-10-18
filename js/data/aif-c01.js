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
  awsOverviewMl:{label:'AWSの概要: 機械学習(ML)と人工知能(AI)', url:'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/machine-learning.html'}
};

var VOCAB = [
  {id:'v1', term:'Amazon Bedrock', domain:'genai', source:SOURCES.bedrock, q:{text:'Amazon Bedrockとは何ですか？', choices:['自社データで独自の機械学習モデルを構築・学習・デプロイするための統合開発環境','テキストから感情やエンティティを抽出する自然言語処理サービス','複数の企業の基盤モデルにAPI経由でアクセスできるフルマネージドサービス','音声をテキストに変換する自動音声認識サービス'], correct:2, why:['これはAmazon SageMaker AIの説明です。Bedrockは自分でモデルを一から学習させるのではなく、既存の基盤モデルを利用・カスタマイズするサービスです。','これはAmazon Comprehendの説明です。','正しい。Amazon Bedrockは、Amazon・Anthropicなど複数のプロバイダーの基盤モデル(FM)にAPIでアクセスし、生成AIアプリケーションを構築できるフルマネージドサービスです。','これはAmazon Transcribeの説明です。']}},
  {id:'v2', term:'Amazon SageMaker AI', domain:'aiml', source:SOURCES.sagemakerAi, q:{text:'Amazon SageMaker AIとは何ですか？', choices:['機械学習モデルの構築・トレーニング・デプロイを行うマネージドサービス','基盤モデルをAPIで呼び出すことに特化したサーバーレスの生成AIサービス','画像や動画から物体・顔・テキストを検出する画像分析サービス','文書をスキャンしてテキストや表・フォームのデータを抽出するサービス'], correct:0, why:['正しい。SageMaker AI（2024年12月にAmazon SageMakerから改称）は、MLモデルの構築・トレーニング・本番環境へのデプロイをマネージドで行えるサービスです。','これはAmazon Bedrockの説明です。','これはAmazon Rekognitionの説明です。','これはAmazon Textractの説明です。']}}
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
