'use client';

import React, { useState, useEffect } from 'react';
import VRMViewer from '@/components/vrm/VRMViewer';
import VRMParameterEditor from '@/components/ui/VRMParameterEditor';
import { Squares } from '@/components/ui/squares-background';
import { Parameter } from './types';

export default function Home() {
  // パラメータの状態管理
  const [parameters, setParameters] = useState<Parameter[]>([]);

  // APIキーの確認
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini APIキーが設定されていません。自然言語機能は動作しません。');
    }
  }, []);

  // パラメータ変更ハンドラー
  const handleParameterChange = (newParameters: Parameter[]) => {
    console.log('パラメータ変更:', newParameters);
    
    // 新しいパラメータを既存のものとマージ
    const updatedParameters = [...parameters];
    
    // 各新しいパラメータに対して処理
    newParameters.forEach(newParam => {
      const existingParamIndex = updatedParameters.findIndex(
        param => param.category === newParam.category && param.name === newParam.name
      );
      
      if (existingParamIndex >= 0) {
        // 既存のパラメータを更新
        updatedParameters[existingParamIndex] = newParam;
      } else {
        // 新しいパラメータを追加
        updatedParameters.push(newParam);
      }
    });
    
    // パラメータ状態を更新
    setParameters(updatedParameters);
    console.log('更新後のパラメータ一覧:', updatedParameters);
  };

  // コマンド送信ハンドラー
  const handleCommandSubmit = async (command: string) => {
    console.log('コマンド受信:', command);
    
    try {
      // Gemini APIを呼び出し
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'APIリクエストが失敗しました');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '不明なエラーが発生しました');
      }

      console.log('APIレスポンス:', data);

      // パラメータを更新
      if (data.parameters && Array.isArray(data.parameters)) {
        handleParameterChange(data.parameters);
      }

      // フィードバックを表示
      const feedbackElement = document.createElement('div');
      feedbackElement.textContent = '設定を更新しました';
      feedbackElement.className = 'fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg z-50 transition-opacity duration-500';
      document.body.appendChild(feedbackElement);
      
      // 3秒後にフィードバックを消す
      setTimeout(() => {
        feedbackElement.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(feedbackElement);
        }, 500);
      }, 3000);

    } catch (error) {
      console.error('API Error:', error);
      
      // エラーフィードバックを表示
      const errorElement = document.createElement('div');
      errorElement.textContent = error instanceof Error ? error.message : '不明なエラーが発生しました';
      errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white py-2 px-4 rounded-md shadow-lg z-50 transition-opacity duration-500';
      document.body.appendChild(errorElement);
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => {
        errorElement.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(errorElement);
        }, 500);
      }, 3000);
    }
  };

  // リセットボタンのハンドラー
  const handleReset = () => {
    setParameters([]);
    console.log('すべてのパラメータをリセットしました');
    
    // 簡単なフィードバックを表示
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
              <VRMViewer parameters={parameters.map(param => ({
                parameterType: param.category,
                parameterName: param.name,
                value: param.value
              }))} />
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
                  onCommandSubmit={handleCommandSubmit}
                  onReset={handleReset}
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

      {/* フッター */}
      <footer className="py-4 px-4 border-t border-border-dark bg-[#121212] mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-sm text-white">© 2025 MyTH株式会社 All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
