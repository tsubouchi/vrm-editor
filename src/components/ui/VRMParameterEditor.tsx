'use client';

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { Parameter } from '@/app/types';
import VRMParameterControl from './VRMParameterControl';
import { processNaturalLanguageCommand } from '../../lib/gemini/geminiService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from './slider';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Textarea } from './textarea';

interface VRMParameterEditorProps {
  onParameterChange: (parameters: Array<{ category: string; name: string; value: number }>) => void;
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
  const [activeTab, setActiveTab] = useState('chat');
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
  
  // チャット入力のハンドラー
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (command.trim()) {
        onCommandSubmit(command.trim());
        setCommand('');
      }
    }
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
      onParameterChange([
        {
          category: 'pose',
          name,
          value,
        }
      ]);
      return newParams;
    });
  }, [onParameterChange]);

  const handleExpressionChange = useCallback((name: string, value: number) => {
    setExpressionParams(prev => {
      const newParams = { ...prev, [name]: value };
      onParameterChange([
        {
          category: 'face',
          name,
          value,
        }
      ]);
      return newParams;
    });
  }, [onParameterChange]);

  return (
    <div className="w-full max-w-md p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="chat" className="flex-1">チャット</TabsTrigger>
          <TabsTrigger value="parameters" className="flex-1">詳細設定</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <Textarea
                placeholder="VRMモデルへの指示を入力（Enterで送信、Shift+Enterで改行）"
                value={command}
                onChange={handleCommandChange}
                onKeyDown={handleKeyDown}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parameters" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ポーズ調整</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 右腕の制御 */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">右腕の回転</Label>
                  <div className="space-y-4">
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
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">左腕の回転</Label>
                  <div className="space-y-4">
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
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">頭の回転</Label>
                  <div className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle>表情調整</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(expressionParams).map(([name, value]) => (
                  <div key={name} className="space-y-2">
                    <Label className="capitalize">{name}</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VRMParameterEditor;
