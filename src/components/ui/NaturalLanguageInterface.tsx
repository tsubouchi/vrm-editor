'use client';

import React, { useState } from 'react';

interface ChatMessageProps {
  message: {
    type: 'user' | 'system';
    text: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.type === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

interface NaturalLanguageInterfaceProps {
  onCommandSubmit: (command: string) => Promise<void>;
  feedback: string | null;
  isProcessing: boolean;
}

const NaturalLanguageInterface: React.FC<NaturalLanguageInterfaceProps> = ({
  onCommandSubmit,
  feedback,
  isProcessing
}) => {
  const [command, setCommand] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'system'; text: string }>>([
    { type: 'system', text: 'VRMモデルへの指示を入力してください。例: 「頭を右に向けて」「笑顔にして」など' }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim() || isProcessing) return;
    
    // ユーザーメッセージを追加
    const userMessage = { type: 'user' as const, text: command };
    setMessages(prev => [...prev, userMessage]);
    
    // コマンドを送信
    await onCommandSubmit(command);
    
    // 入力をクリア
    setCommand('');
  };

  // フィードバックが更新されたらメッセージに追加
  React.useEffect(() => {
    if (feedback) {
      setMessages(prev => [...prev, { type: 'system', text: feedback }]);
    }
  }, [feedback]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-2">自然言語コマンド</h2>
      
      {/* チャット履歴 */}
      <div className="h-64 overflow-y-auto mb-4 p-2 border border-gray-200 rounded">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>
      
      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="モデルへの指示を入力してください..."
          className="flex-1 p-2 border border-gray-300 rounded-l-md"
          disabled={isProcessing}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-r-md ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
          disabled={isProcessing}
        >
          {isProcessing ? '処理中...' : '送信'}
        </button>
      </form>
    </div>
  );
};

export default NaturalLanguageInterface;
