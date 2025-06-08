
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Configura tu API Key de OpenAI para comenzar..." : "Escribe tu consulta jurídica aquí... (Shift + Enter para nueva línea)"}
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading || disabled}
          />
        </div>
        <Button 
          type="submit" 
          size="lg"
          disabled={!message.trim() || isLoading || disabled}
          className="h-[60px] px-6"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2 px-1">
        LexIA está especializado en Derecho Español y Europeo. Sus respuestas son orientativas.
      </div>
    </form>
  );
};

export default ChatInput;
