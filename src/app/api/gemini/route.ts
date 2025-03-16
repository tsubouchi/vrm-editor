import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// CORSヘッダーの設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONSリクエストのハンドラー
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // CORSヘッダーを追加
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
    };

    const { command } = await request.json();

    if (!command) {
      return NextResponse.json({
        success: false,
        error: 'コマンドが指定されていません'
      }, { status: 400, headers });
    }

    // モデルの設定
    const model = genAI.getGenerativeModel({ 
      model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-lite'
    });

    console.log('Using Gemini model:', process.env.NEXT_PUBLIC_GEMINI_MODEL);

    // プロンプトの設定
    const prompt = `
あなたはVRMモデルのパラメータを調整するアシスタントです。
ユーザーからの指示に基づいて、必ず以下の形式のJSONを返してください。
他の説明は不要です。JSONのみを返してください。

[
  {
    "category": "pose" | "face",
    "name": string,
    "value": number (-1から1の範囲)
  }
]

使用可能なパラメータ:
1. ポーズ (category: "pose")
   - rightArmRotationX/Y/Z: 右腕の回転
   - leftArmRotationX/Y/Z: 左腕の回転
   - headRotationX/Y/Z: 頭の回転
   - spineRotationX/Y/Z: 背骨の回転

2. 表情 (category: "face")
   - happy: 笑顔
   - angry: 怒り
   - sad: 悲しみ
   - neutral: 通常
   - surprised: 驚き
   - relaxed: リラックス

例：
入力: "笑顔にして"
出力: [{"category": "face", "name": "happy", "value": 1.0}]

入力: "右腕を上げて"
出力: [{"category": "pose", "name": "rightArmRotationX", "value": -0.5}]

入力: "悲しい表情"
出力: [{"category": "face", "name": "sad", "value": 0.8}]

注意：
- 必ず上記の形式のJSONのみを返してください
- ポーズの値は-1から1の範囲で指定してください
- 表情の値は0から1の範囲で指定してください
- 複数のパラメータを組み合わせても構いません
- JSONの前後に説明文を入れないでください

ユーザーの指示: ${command}
`;

    // Gemini APIを呼び出し
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONとして解析可能な部分を抽出
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: 'パラメータの形式が不正です'
      }, { status: 400, headers });
    }

    const parameters = JSON.parse(jsonMatch[0]);

    // デバッグ用：パラメータの内容を確認
    console.log('Generated parameters:', parameters);

    // パラメータの形式を検証
    if (!Array.isArray(parameters)) {
      return NextResponse.json({
        success: false,
        error: 'パラメータが配列形式ではありません'
      }, { status: 400, headers });
    }

    // 各パラメータの形式を検証
    const validParameters = parameters.filter(param => {
      const isValid = 
        param &&
        typeof param === 'object' &&
        typeof param.category === 'string' &&
        typeof param.name === 'string' &&
        typeof param.value === 'number';

      // カテゴリー別の値の範囲チェック
      if (isValid) {
        if (param.category === 'pose') {
          if (param.value < -1 || param.value > 1) {
            console.warn('ポーズパラメータの値が範囲外です:', param);
            return false;
          }
        } else if (param.category === 'face') {
          if (param.value < 0 || param.value > 1) {
            console.warn('表情パラメータの値が範囲外です:', param);
            return false;
          }
        }
      }

      if (!isValid) {
        console.warn('無効なパラメータ形式:', param);
      }

      return isValid;
    });

    // デバッグ用：有効なパラメータを表示
    console.log('有効なパラメータ:', validParameters);

    // レスポンスを返す
    return NextResponse.json({
      success: true,
      parameters: validParameters,
      message: text
    }, { headers });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    }, { status: 500, headers: corsHeaders });
  }
} 