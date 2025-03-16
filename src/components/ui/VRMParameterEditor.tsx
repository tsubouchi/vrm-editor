'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Parameter } from '@/app/types';
import VRMParameterControl from './VRMParameterControl';
import { processNaturalLanguageCommand } from '../../lib/gemini/geminiService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from './slider';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface VRMParameterEditorProps {
  onParameterChange: (parameters: Parameter[]) => void;
  onCommandSubmit: (command: string) => void;
  currentParameters?: Parameter[];
  onReset: () => void;
}

const VRMParameterEditor: React.FC<VRMParameterEditorProps> = ({
  onParameterChange,
  onCommandSubmit,
  currentParameters,
  onReset,
}) => {
  const [command, setCommand] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'system', text: string }>>([
    { type: 'system', text: 'こんにちは！VRMモデルをどのように変更しますか？' }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'pose' | 'face' | 'material'>('pose');
  const [paramValues, setParamValues] = useState<Record<string, Record<string, number>>>({
    pose: {},
    face: {},
    material: {
      transparency: 1,
      metallic: 0,
      roughness: 0.5
    }
  });
  
  // チャット履歴の自動スクロール用のref
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // コマンド送信の最適化用のdebounceタイマー
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // パラメータの状態管理
  const [poseParams, setPoseParams] = useState<Record<string, number>>({
    rightArmRotationX: 0,
    rightArmRotationY: 0,
    rightArmRotationZ: 0,
    leftArmRotationX: 0,
    leftArmRotationY: 0,
    leftArmRotationZ: 0,
    headRotationX: 0,
    headRotationY: 0,
    headRotationZ: 0,
    spineRotationX: 0,
    spineRotationY: 0,
    spineRotationZ: 0,
  });

  const [expressionParams, setExpressionParams] = useState<Record<string, number>>({
    happy: 0,
    angry: 0,
    sad: 0,
    neutral: 0,
    surprised: 0,
    relaxed: 0,
  });

  // 現在のパラメータが変更されたときに、内部の状態を更新
  useEffect(() => {
    if (currentParameters && currentParameters.length > 0) {
      const newParamValues = { ...paramValues };
      
      currentParameters.forEach(param => {
        if (!newParamValues[param.category]) {
          newParamValues[param.category] = {};
        }
        newParamValues[param.category][param.name] = param.value;
      });
      
      setParamValues(newParamValues);
    } else if (currentParameters && currentParameters.length === 0) {
      // リセットされた場合、すべてのパラメータをデフォルト値に戻す
      setParamValues({
        pose: {},
        face: {},
        material: {
          transparency: 1,
          metallic: 0,
          roughness: 0.5
        }
      });
      
      // リセットメッセージをチャット履歴に追加
      setChatHistory(prev => [...prev, { type: 'system', text: 'すべてのパラメータがリセットされました。' }]);
    }
  }, [currentParameters]);
  
  // チャット履歴が更新されたときに自動スクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommand(e.target.value);
    
    // debounce処理をキャンセル
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  const handleCommandSubmit = () => {
    if (command.trim()) {
      // コマンドをチャット履歴に追加
      setChatHistory(prev => [...prev, { type: 'user', text: command }]);
      
      // LLMにコマンドを送信
      onCommandSubmit(command);
      
      // 入力フィールドをクリア
      setCommand('');
    }
  };
  
  // 最適化されたコマンド処理（Enterキーでの送信）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommandSubmit();
    }
  };

  const handleTabChange = (tab: 'pose' | 'face' | 'material') => {
    setActiveTab(tab);
  };

  const handleParameterChange = (category: string, name: string, value: number) => {
    // 内部の状態を更新
    setParamValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [name]: value
      }
    }));
    
    // 親コンポーネントに通知
    onParameterChange([{ category, name, value }]);
  };
  
  const getParameterValue = (category: string, name: string, defaultVal: number = 0): number => {
    if (paramValues[category] && paramValues[category][name] !== undefined) {
      return paramValues[category][name];
    }
    return defaultVal;
  };

  // パラメータ変更のハンドラー
  const handlePoseChange = useCallback((name: string, value: number) => {
    setPoseParams(prev => {
      const newParams = { ...prev, [name]: value };
      // ポーズパラメータの変更を通知
      onParameterChange(
        Object.entries(newParams).map(([paramName, paramValue]) => ({
          category: 'pose',
          name: paramName,
          value: paramValue,
        }))
      );
      return newParams;
    });
  }, [onParameterChange]);

  const handleExpressionChange = useCallback((name: string, value: number) => {
    setExpressionParams(prev => {
      const newParams = { ...prev, [name]: value };
      // 表情パラメータの変更を通知
      onParameterChange(
        Object.entries(newParams).map(([paramName, paramValue]) => ({
          category: 'face',
          name: paramName,
          value: paramValue,
        }))
      );
      return newParams;
    });
  }, [onParameterChange]);

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md w-full">
      <h2 className="text-xl font-bold mb-4 text-white">モデルコントロール</h2>
      
      {/* チャット履歴表示エリア（高さを2倍に） */}
      <div 
        ref={chatContainerRef}
        className="bg-[#2a2a2a] p-3 rounded-md mb-4 h-80 overflow-y-auto"
        style={{ height: '16rem' }}
      >
        {chatHistory.map((message, index) => (
          <div 
            key={index} 
            className={`mb-2 p-2 rounded-md ${
              message.type === 'user' 
                ? 'bg-[#303f9f] text-white ml-8' 
                : 'bg-[#424242] text-gray-200 mr-8'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      
      {/* コマンド入力エリア（高さを3倍に） */}
      <div className="mb-4">
        <textarea
          value={command}
          onChange={handleCommandChange}
          onKeyDown={handleKeyDown}
          className="w-full p-3 border border-gray-700 rounded-md bg-[#2a2a2a] text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="モデルへの指示を入力..."
          style={{ height: '9rem', minHeight: '9rem' }}
        />
        <div className="flex justify-between mt-2">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors"
          >
            リセット
          </button>
          <button
            onClick={handleCommandSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            送信
          </button>
        </div>
      </div>
      
      {/* アコーディオンヘッダー */}
      <div
        className="flex justify-between items-center p-2 bg-[#333333] text-white rounded-md cursor-pointer mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">詳細パラメータ設定</span>
        <span>{isExpanded ? '▲' : '▼'}</span>
      </div>
      
      {/* アコーディオンの内容 */}
      {isExpanded && (
        <div className="mt-4">
          {/* タブナビゲーション */}
          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === 'pose' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabChange('pose')}
            >
              ポーズ
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'face' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabChange('face')}
            >
              表情
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'material' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabChange('material')}
            >
              マテリアル
            </button>
          </div>
          
          {/* ポーズパラメータ */}
          {activeTab === 'pose' && (
            <div className="max-h-96 overflow-y-auto p-2">
              <Card>
                <CardHeader>
                  <CardTitle>ポーズ調整</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 右腕の制御 */}
                    <div className="space-y-2">
                      <Label>右腕の回転</Label>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>X軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.rightArmRotationX]}
                            onValueChange={([value]) => handlePoseChange('rightArmRotationX', value)}
                          />
                        </div>
                        <div>
                          <Label>Y軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.rightArmRotationY]}
                            onValueChange={([value]) => handlePoseChange('rightArmRotationY', value)}
                          />
                        </div>
                        <div>
                          <Label>Z軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.rightArmRotationZ]}
                            onValueChange={([value]) => handlePoseChange('rightArmRotationZ', value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 左腕の制御 */}
                    <div className="space-y-2">
                      <Label>左腕の回転</Label>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>X軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.leftArmRotationX]}
                            onValueChange={([value]) => handlePoseChange('leftArmRotationX', value)}
                          />
                        </div>
                        <div>
                          <Label>Y軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.leftArmRotationY]}
                            onValueChange={([value]) => handlePoseChange('leftArmRotationY', value)}
                          />
                        </div>
                        <div>
                          <Label>Z軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.leftArmRotationZ]}
                            onValueChange={([value]) => handlePoseChange('leftArmRotationZ', value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 頭の制御 */}
                    <div className="space-y-2">
                      <Label>頭の回転</Label>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>X軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.headRotationX]}
                            onValueChange={([value]) => handlePoseChange('headRotationX', value)}
                          />
                        </div>
                        <div>
                          <Label>Y軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.headRotationY]}
                            onValueChange={([value]) => handlePoseChange('headRotationY', value)}
                          />
                        </div>
                        <div>
                          <Label>Z軸</Label>
                          <Slider
                            min={-1}
                            max={1}
                            step={0.01}
                            value={[poseParams.headRotationZ]}
                            onValueChange={([value]) => handlePoseChange('headRotationZ', value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* 表情パラメータ */}
          {activeTab === 'face' && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>表情調整</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(expressionParams).map(([name, value]) => (
                      <div key={name}>
                        <Label>{name}</Label>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[value]}
                          onValueChange={([newValue]) => handleExpressionChange(name, newValue)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* マテリアルパラメータ */}
          {activeTab === 'material' && (
            <div>
              <h3 className="font-medium mb-3">シェーダー設定</h3>
              <VRMParameterControl
                label="透明度"
                min={0}
                max={1}
                step={0.01}
                defaultValue={1}
                value={getParameterValue('material', 'transparency', 1)}
                onChange={(value) => handleParameterChange('material', 'transparency', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="メタリック"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('material', 'metallic', 0)}
                onChange={(value) => handleParameterChange('material', 'metallic', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="粗さ"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.5}
                value={getParameterValue('material', 'roughness', 0.5)}
                onChange={(value) => handleParameterChange('material', 'roughness', value)}
                showValue={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VRMParameterEditor;
