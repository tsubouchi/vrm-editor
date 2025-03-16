'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Parameter } from '@/app/types';
import VRMParameterControl from './VRMParameterControl';
import { processNaturalLanguageCommand } from '../../lib/gemini/geminiService';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
              <h3 className="font-medium mb-3">頭部回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'headRotationX')}
                onChange={(value) => handleParameterChange('pose', 'headRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'headRotationY')}
                onChange={(value) => handleParameterChange('pose', 'headRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'headRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'headRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">胴体回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'spineRotationX')}
                onChange={(value) => handleParameterChange('pose', 'spineRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'spineRotationY')}
                onChange={(value) => handleParameterChange('pose', 'spineRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'spineRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'spineRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">左腕回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftArmRotationX')}
                onChange={(value) => handleParameterChange('pose', 'leftArmRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftArmRotationY')}
                onChange={(value) => handleParameterChange('pose', 'leftArmRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftArmRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'leftArmRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">右腕回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightArmRotationX')}
                onChange={(value) => handleParameterChange('pose', 'rightArmRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightArmRotationY')}
                onChange={(value) => handleParameterChange('pose', 'rightArmRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightArmRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'rightArmRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">左手回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftHandRotationX')}
                onChange={(value) => handleParameterChange('pose', 'leftHandRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftHandRotationY')}
                onChange={(value) => handleParameterChange('pose', 'leftHandRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftHandRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'leftHandRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">右手回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightHandRotationX')}
                onChange={(value) => handleParameterChange('pose', 'rightHandRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightHandRotationY')}
                onChange={(value) => handleParameterChange('pose', 'rightHandRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightHandRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'rightHandRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">左脚回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftLegRotationX')}
                onChange={(value) => handleParameterChange('pose', 'leftLegRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftLegRotationY')}
                onChange={(value) => handleParameterChange('pose', 'leftLegRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftLegRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'leftLegRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">右脚回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightLegRotationX')}
                onChange={(value) => handleParameterChange('pose', 'rightLegRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightLegRotationY')}
                onChange={(value) => handleParameterChange('pose', 'rightLegRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightLegRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'rightLegRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">左足回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftFootRotationX')}
                onChange={(value) => handleParameterChange('pose', 'leftFootRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftFootRotationY')}
                onChange={(value) => handleParameterChange('pose', 'leftFootRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'leftFootRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'leftFootRotationZ', value)}
                showValue={true}
              />
              
              <h3 className="font-medium mb-3 mt-6">右足回転</h3>
              <VRMParameterControl
                label="X軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightFootRotationX')}
                onChange={(value) => handleParameterChange('pose', 'rightFootRotationX', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Y軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightFootRotationY')}
                onChange={(value) => handleParameterChange('pose', 'rightFootRotationY', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="Z軸回転"
                min={-1}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('pose', 'rightFootRotationZ')}
                onChange={(value) => handleParameterChange('pose', 'rightFootRotationZ', value)}
                showValue={true}
              />
            </div>
          )}
          
          {/* 表情パラメータ */}
          {activeTab === 'face' && (
            <div>
              <h3 className="font-medium mb-3">表情ブレンドシェイプ</h3>
              <VRMParameterControl
                label="笑顔"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('face', 'happy')}
                onChange={(value) => handleParameterChange('face', 'happy', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="悲しい"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('face', 'sad')}
                onChange={(value) => handleParameterChange('face', 'sad', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="怒り"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('face', 'angry')}
                onChange={(value) => handleParameterChange('face', 'angry', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="驚き"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('face', 'surprised')}
                onChange={(value) => handleParameterChange('face', 'surprised', value)}
                showValue={true}
              />
              <VRMParameterControl
                label="まばたき"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0}
                value={getParameterValue('face', 'blink')}
                onChange={(value) => handleParameterChange('face', 'blink', value)}
                showValue={true}
              />
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
