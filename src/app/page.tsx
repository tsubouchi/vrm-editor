'use client';

import React, { useState, useEffect } from 'react';
import VRMViewer from '@/components/vrm/VRMViewer';
import VRMParameterEditor from '@/components/ui/VRMParameterEditor';
import { Squares } from '@/components/ui/squares-background';

export default function Home() {
  // パラメータの状態管理
  const [parameters, setParameters] = useState<{
    parameterType: string;
    parameterName: string;
    value: number;
  }[]>([]);

  // APIキーの確認
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini APIキーが設定されていません。自然言語機能は動作しません。');
    }
  }, []);

  // パラメータ変更ハンドラー
  const handleParameterChange = (parameterType: string, parameterName: string, value: number) => {
    console.log(`パラメータ変更: ${parameterType} - ${parameterName} = ${value}`);
    
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
    console.log('更新後のパラメータ一覧:', newParameters);
  };

  // リセットボタンのハンドラー
  const handleReset = () => {
    setParameters([]);
    console.log('すべてのパラメータをリセットしました');
    
    // 簡単なフィードバックを表示（オプション）
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = 'パラメータをリセットしました';
    feedbackElement.className = 'fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg z-50 transition-opacity duration-500';
    document.body.appendChild(feedbackElement);
    
    // 3秒後にフィードバックを消す
    setTimeout(() => {
      feedbackElement.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(feedbackElement);
      }, 500);
    }, 3000);
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
                <p className="text-sm text-gray-400">自然言語で指示するか、詳細設定を開いて調整</p>
              </div>
              <div className="p-4">
                <VRMParameterEditor 
                  onParameterChange={handleParameterChange} 
                  currentParameters={parameters}
                />
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
