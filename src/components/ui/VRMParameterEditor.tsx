'use client';

import React, { useState } from 'react';
import VRMParameterControl from './VRMParameterControl';

interface VRMParameterEditorProps {
  onParameterChange: (parameterType: string, parameterName: string, value: number) => void;
}

const VRMParameterEditor: React.FC<VRMParameterEditorProps> = ({ onParameterChange }) => {
  // パラメータの状態管理
  const [activeTab, setActiveTab] = useState<string>('pose');

  // タブ切り替え処理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // パラメータ変更ハンドラー
  const handleParameterChange = (parameterType: string, parameterName: string, value: number) => {
    onParameterChange(parameterType, parameterName, value);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">パラメータ編集</h2>
      
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
        <div>
          <h3 className="font-medium mb-3">頭部回転</h3>
          <VRMParameterControl
            label="X軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'headRotationX', value)}
          />
          <VRMParameterControl
            label="Y軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'headRotationY', value)}
          />
          <VRMParameterControl
            label="Z軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'headRotationZ', value)}
          />
          
          <h3 className="font-medium mb-3 mt-6">胴体回転</h3>
          <VRMParameterControl
            label="X軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'spineRotationX', value)}
          />
          <VRMParameterControl
            label="Y軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'spineRotationY', value)}
          />
          <VRMParameterControl
            label="Z軸回転"
            min={-1}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('pose', 'spineRotationZ', value)}
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
            onChange={(value) => handleParameterChange('face', 'happy', value)}
          />
          <VRMParameterControl
            label="悲しい"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('face', 'sad', value)}
          />
          <VRMParameterControl
            label="怒り"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('face', 'angry', value)}
          />
          <VRMParameterControl
            label="驚き"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('face', 'surprised', value)}
          />
          <VRMParameterControl
            label="まばたき"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('face', 'blink', value)}
          />
        </div>
      )}
      
      {/* マテリアルパラメータ */}
      {activeTab === 'material' && (
        <div>
          <h3 className="font-medium mb-3">マテリアル設定</h3>
          <VRMParameterControl
            label="透明度"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            onChange={(value) => handleParameterChange('material', 'opacity', value)}
          />
          <VRMParameterControl
            label="メタリック"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0}
            onChange={(value) => handleParameterChange('material', 'metallic', value)}
          />
          <VRMParameterControl
            label="粗さ"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.5}
            onChange={(value) => handleParameterChange('material', 'roughness', value)}
          />
        </div>
      )}
    </div>
  );
};

export default VRMParameterEditor;
