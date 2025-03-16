'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIクライアントの初期化
const initGeminiClient = () => {
  // 環境変数からAPIキーを取得
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini APIキーが設定されていません。');
    return null;
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// 意図解析のためのプロンプト
const INTENT_ANALYSIS_PROMPT = `
あなたはVRMモデルを操作するための自然言語コマンドを解析するAIアシスタントです。
ユーザーの入力から、VRMモデルのどのパラメータを変更したいのかを解析してください。

以下のパラメータカテゴリと具体的なパラメータ名を使用してください：

1. ポーズ (pose)
   - headRotationX: 頭部のX軸回転 (-1.0 から 1.0)
   - headRotationY: 頭部のY軸回転 (-1.0 から 1.0)
   - headRotationZ: 頭部のZ軸回転 (-1.0 から 1.0)
   - spineRotationX: 胴体のX軸回転 (-1.0 から 1.0)
   - spineRotationY: 胴体のY軸回転 (-1.0 から 1.0)
   - spineRotationZ: 胴体のZ軸回転 (-1.0 から 1.0)

2. 表情 (face)
   - happy: 笑顔 (0.0 から 1.0)
   - sad: 悲しい表情 (0.0 から 1.0)
   - angry: 怒った表情 (0.0 から 1.0)
   - surprised: 驚いた表情 (0.0 から 1.0)
   - blink: まばたき (0.0 から 1.0)

3. マテリアル (material)
   - opacity: 透明度 (0.0 から 1.0)
   - metallic: メタリック (0.0 から 1.0)
   - roughness: 粗さ (0.0 から 1.0)

ユーザーの入力: "{userInput}"

JSON形式で意図を出力してください。例:
{
  "intent": "モデルのパラメータ変更",
  "parameters": [
    {
      "category": "pose",
      "name": "headRotationY",
      "value": 0.5,
      "confidence": 0.9
    }
  ],
  "feedback": "頭を右に向けます。"
}
`;

// 指示文生成のためのプロンプト
const INSTRUCTION_GENERATION_PROMPT = `
あなたはVRMモデルを操作するための指示文を生成するAIアシスタントです。
解析された意図に基づいて、VRMモデルへの具体的な指示文を生成してください。

解析された意図:
{intentAnalysis}

以下の形式で指示文を生成してください：
{
  "instructions": [
    {
      "category": "pose",
      "name": "headRotationY",
      "value": 0.5,
      "description": "頭を右に30度回転"
    }
  ],
  "feedback": "頭を右に向けました。他に調整が必要ですか？"
}
`;

// クエリ変換のためのプロンプト
const QUERY_CONVERSION_PROMPT = `
あなたはVRMモデルを操作するためのクエリを生成するAIアシスタントです。
生成された指示文に基づいて、システム内部で使用するVRMパラメータクエリを生成してください。

生成された指示文:
{instructions}

以下の形式でクエリを生成してください：
{
  "parameters": [
    {
      "parameterType": "pose",
      "parameterName": "headRotationY",
      "value": 0.5
    }
  ],
  "feedback": "頭を右に向けました。他に調整が必要ですか？"
}
`;

// 意図解析の実行
export const analyzeIntent = async (userInput: string) => {
  const genAI = initGeminiClient();
  if (!genAI) return null;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = INTENT_ANALYSIS_PROMPT.replace('{userInput}', userInput);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONを抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('意図解析中にエラーが発生しました:', error);
    return null;
  }
};

// 指示文生成の実行
export const generateInstructions = async (intentAnalysis: any) => {
  const genAI = initGeminiClient();
  if (!genAI) return null;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = INSTRUCTION_GENERATION_PROMPT.replace('{intentAnalysis}', JSON.stringify(intentAnalysis, null, 2));
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONを抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('指示文生成中にエラーが発生しました:', error);
    return null;
  }
};

// クエリ変換の実行
export const convertToQuery = async (instructions: any) => {
  const genAI = initGeminiClient();
  if (!genAI) return null;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = QUERY_CONVERSION_PROMPT.replace('{instructions}', JSON.stringify(instructions, null, 2));
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONを抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('クエリ変換中にエラーが発生しました:', error);
    return null;
  }
};

// 多段階処理パイプラインの実行
export const processNaturalLanguageCommand = async (userInput: string) => {
  try {
    console.log('自然言語コマンド処理を開始:', userInput);
    
    // ステップ1: 意図解析
    const intentAnalysis = await analyzeIntent(userInput);
    if (!intentAnalysis) {
      console.warn('意図解析に失敗しました');
      return {
        success: false,
        feedback: '意図の解析に失敗しました。別の表現で試してください。'
      };
    }
    
    console.log('意図解析結果:', intentAnalysis);
    
    // ステップ2: 指示文生成
    const instructions = await generateInstructions(intentAnalysis);
    if (!instructions) {
      console.warn('指示文生成に失敗しました');
      return {
        success: false,
        feedback: '指示文の生成に失敗しました。別の表現で試してください。'
      };
    }
    
    console.log('指示文生成結果:', instructions);
    
    // ステップ3: クエリ変換
    const query = await convertToQuery(instructions);
    if (!query) {
      console.warn('クエリ変換に失敗しました');
      return {
        success: false,
        feedback: 'クエリの変換に失敗しました。別の表現で試してください。'
      };
    }
    
    console.log('クエリ変換結果:', query);
    
    return {
      success: true,
      parameters: query.parameters,
      feedback: query.feedback
    };
  } catch (error) {
    console.error('自然言語コマンド処理中にエラーが発生しました:', error);
    return {
      success: false,
      feedback: 'エラーが発生しました。別の表現で試してください。'
    };
  }
};
