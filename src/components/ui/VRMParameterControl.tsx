'use client';

import React, { useState, useEffect } from 'react';

interface VRMParameterControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  value?: number;
  showValue?: boolean;
  onChange: (value: number) => void;
}

const VRMParameterControl: React.FC<VRMParameterControlProps> = ({
  label,
  min,
  max,
  step,
  defaultValue,
  value,
  showValue = false,
  onChange
}) => {
  const [internalValue, setInternalValue] = useState<number>(defaultValue);
  
  // valueプロパティが変更された場合、内部の状態を更新
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setInternalValue(newValue);
    onChange(newValue);
  };

  // 表示する値（外部から提供されたvalueがある場合はそれを使用、なければ内部の状態を使用）
  const displayValue = value !== undefined ? value : internalValue;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        {(showValue || value !== undefined) && (
          <span className="text-sm text-gray-500">{displayValue.toFixed(2)}</span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

export default VRMParameterControl;
