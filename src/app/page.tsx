'use client';

import React, { useState, useEffect } from 'react';
import VRMViewer from '@/components/vrm/VRMViewer';
import VRMParameterEditor from '@/components/ui/VRMParameterEditor';
import NaturalLanguageInterface from '@/components/ui/NaturalLanguageInterface';
import { processNaturalLanguageCommand } from '@/lib/gemini/geminiService';
import { Squares } from '@/components/ui/squares-background';

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
    <div className="flex flex-col min-h-screen bg-bg-dark">
      {/* 背景 - グリッド表示（透明度を下げる） */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Squares 
          direction="diagonal"
          speed={0.3}
          squareSize={50}
          borderColor="#333333" 
          hoverFillColor="#222222"
          className="opacity-15"
        />
      </div>
      
      {/* ヘッダー */}
      <header className="py-4 px-4 border-b border-border-dark bg-bg-dark/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white text-center">VRMモデルエディター</h1>
        </div>
      </header>
      
      {/* コンテンツ本体 */}
      <main className="container mx-auto py-6 px-4 flex-grow relative z-10">
        {/* メインコンテンツ領域 - カードレイアウト */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* VRMプレビューエリア - 左カード */}
          <div className="w-full md:w-3/5 bg-card-dark border border-border-dark rounded-lg shadow-card overflow-hidden relative z-10">
            <div className="p-4 border-b border-border-dark bg-gradient-card">
              <h2 className="text-xl font-semibold text-white">VRMモデルビューアー</h2>
              <p className="text-sm text-gray-400">3Dモデルを閲覧・編集</p>
            </div>
            <div className="w-full h-[70vh] relative">
              <VRMViewer parameters={parameters} />
            </div>
          </div>
          
          {/* 設定パネル - 右カード */}
          <div className="w-full md:w-2/5 flex flex-col gap-4">
            {/* パラメータ編集パネル */}
            <div className="bg-card-dark border border-border-dark rounded-lg shadow-card">
              <div className="p-4 border-b border-border-dark bg-gradient-card">
                <h2 className="text-xl font-semibold text-white">パラメータ設定</h2>
                <p className="text-sm text-gray-400">モデルの表情や姿勢を調整</p>
              </div>
              <div className="p-4">
                <VRMParameterEditor onParameterChange={handleParameterChange} />
                <div className="mt-4">
                  <button
                    onClick={handleReset}
                    className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white py-2 px-4 rounded-md transition-all duration-200 font-medium"
                  >
                    パラメータをリセット
                  </button>
                </div>
              </div>
            </div>
            
            {/* 自然言語インターフェース */}
            <div className="bg-card-dark border border-border-dark rounded-lg shadow-card">
              <div className="p-4 border-b border-border-dark bg-gradient-card">
                <h2 className="text-xl font-semibold text-white">AI支援</h2>
                <p className="text-sm text-gray-400">自然言語でモデルを操作</p>
              </div>
              <div className="p-4">
                <NaturalLanguageInterface 
                  onCommandSubmit={handleCommandSubmit}
                  feedback={feedback}
                  isProcessing={isProcessing}
                />
                
                {!isApiKeySet && (
                  <div className="mt-4 p-4 bg-yellow-900/40 border border-yellow-900/60 text-yellow-200 rounded-md">
                    <p className="font-medium">注意: Gemini APIキーが設定されていません</p>
                    <p className="text-sm mt-1">自然言語機能を利用するには、環境変数 NEXT_PUBLIC_GEMINI_API_KEY を設定してください。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* プロジェクトについての説明 */}
        <div className="mt-8 text-center">
          <p className="text-gray-400">このアプリケーションについて</p>
          <p className="text-xs mt-1 text-gray-500">このVRMエディターは<a href="https://github.com/tsubouchi/vrm-editor" className="text-accent-blue hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">GitHub</a>で公開されています。</p>
        </div>
      </main>
    </div>
  );
}
