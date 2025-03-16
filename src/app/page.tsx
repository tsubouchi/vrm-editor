'use client';

import React, { useState, useEffect } from 'react';
import VRMViewer from '@/components/vrm/VRMViewer';
import VRMParameterEditor from '@/components/ui/VRMParameterEditor';
import NaturalLanguageInterface from '@/components/ui/NaturalLanguageInterface';
import { processNaturalLanguageCommand } from '@/lib/gemini/geminiService';

export default function Home() {
  // パラメータの状態管理
  const [parameters, setParameters] = useState<{
    parameterType: string;
    parameterName: string;
    value: number;
  }[]>([]);

  // 自然言語処理の状態管理
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  // APIキーの確認
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    setIsApiKeySet(!!apiKey);
    
    if (!apiKey) {
      console.warn('Gemini APIキーが設定されていません。自然言語機能は動作しません。');
    }
  }, []);

  // パラメータ変更ハンドラー
  const handleParameterChange = (parameterType: string, parameterName: string, value: number) => {
    // 既存のパラメータ配列から同じタイプと名前のパラメータを探す
    const existingParamIndex = parameters.findIndex(
      param => param.parameterType === parameterType && param.parameterName === parameterName
    );

    // 新しいパラメータ配列を作成
    const newParameters = [...parameters];
    
    if (existingParamIndex >= 0) {
      // 既存のパラメータを更新
      newParameters[existingParamIndex] = { parameterType, parameterName, value };
    } else {
      // 新しいパラメータを追加
      newParameters.push({ parameterType, parameterName, value });
    }
    
    // パラメータ状態を更新
    setParameters(newParameters);
  };

  // 自然言語コマンド処理ハンドラー
  const handleCommandSubmit = async (command: string) => {
    if (!isApiKeySet) {
      setFeedback('Gemini APIキーが設定されていないため、自然言語機能は利用できません。');
      return;
    }
    
    setIsProcessing(true);
    setFeedback(null);
    
    try {
      // Gemini APIを使用して自然言語コマンドを処理
      const result = await processNaturalLanguageCommand(command);
      
      if (result.success && result.parameters) {
        // パラメータを更新
        const newParameters = [...parameters];
        
        result.parameters.forEach(param => {
          const { parameterType, parameterName, value } = param;
          
          // 既存のパラメータを探す
          const existingParamIndex = newParameters.findIndex(
            p => p.parameterType === parameterType && p.parameterName === parameterName
          );
          
          if (existingParamIndex >= 0) {
            // 既存のパラメータを更新
            newParameters[existingParamIndex] = { parameterType, parameterName, value };
          } else {
            // 新しいパラメータを追加
            newParameters.push({ parameterType, parameterName, value });
          }
        });
        
        // パラメータ状態を更新
        setParameters(newParameters);
        
        // フィードバックを設定
        setFeedback(result.feedback);
      } else {
        // エラーフィードバックを設定
        setFeedback(result.feedback || 'コマンドの処理に失敗しました。別の表現で試してください。');
      }
    } catch (error) {
      console.error('コマンド処理中にエラーが発生しました:', error);
      setFeedback('エラーが発生しました。別の表現で試してください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // リセットボタンのハンドラー
  const handleReset = () => {
    setParameters([]);
    setFeedback('すべてのパラメータをリセットしました。');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-4">VRMモデルエディター</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 左サイドバー: パラメータ編集 */}
          <div className="md:col-span-1">
            <VRMParameterEditor onParameterChange={handleParameterChange} />
            <div className="mt-4">
              <button
                onClick={handleReset}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              >
                パラメータをリセット
              </button>
            </div>
          </div>
          
          {/* 中央エリア: モデルプレビュー */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-2">モデルプレビュー</h2>
            <VRMViewer modelPath="/models/maria.vrm" parameters={parameters} />
          </div>
        </div>
        
        {/* 自然言語インターフェース */}
        <NaturalLanguageInterface 
          onCommandSubmit={handleCommandSubmit}
          feedback={feedback}
          isProcessing={isProcessing}
        />
        
        {!isApiKeySet && (
          <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
            <p className="font-medium">注意: Gemini APIキーが設定されていません</p>
            <p>自然言語機能を利用するには、環境変数 NEXT_PUBLIC_GEMINI_API_KEY を設定してください。</p>
          </div>
        )}
      </div>
    </main>
  );
}
