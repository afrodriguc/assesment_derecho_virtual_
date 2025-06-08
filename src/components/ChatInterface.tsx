
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger, Sidebar, SidebarContent } from '@/components/ui/sidebar';
import { Scale, LogOut, Settings, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ApiKeyInput from './ApiKeyInput';
import ConversationHistory from './ConversationHistory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  created_at: Date;
  messageCount: number;
}

interface ChatInterfaceProps {
  onLogout: () => void;
}

const SYSTEM_PROMPT = "Eres LexIA, asistente jurídico especializado en Derecho español y europeo. Responde con lenguaje claro y, cuando proceda, menciona la norma o jurisprudencia aplicable.";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // TODO: Cargar conversaciones desde Supabase
    // loadConversationsFromSupabase();
    console.log('ChatInterface mounted - ready for Supabase integration');
  }, []);

  const handleApiKeySet = (key: string, selectedProvider: 'openai' | 'gemini') => {
    setApiKey(key);
    setProvider(selectedProvider);
    toast({
      title: "API Key configurada",
      description: `Usando ${selectedProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}`,
    });
  };

  const callLLMAPI = async (userMessage: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('API Key no configurada');
    }

    // Preparar mensajes para la API
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: apiMessages,
          temperature: 0.4,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error de OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      // Gemini API call
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMessage}` }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error de Gemini: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Por favor, configura tu API Key primero",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Guardar mensaje de usuario en Supabase
      // await saveMessageToSupabase(userMessage);
      
      const response = await callLLMAPI(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        created_at: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // TODO: Guardar respuesta del asistente en Supabase
      // await saveMessageToSupabase(assistantMessage);
      
    } catch (error) {
      console.error('Error calling LLM API:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del asistente. Verifica tu API Key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (id: string) => {
    // TODO: Cargar mensajes de la conversación desde Supabase
    console.log('Loading conversation:', id);
    setCurrentConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    // TODO: Eliminar conversación de Supabase
    console.log('Deleting conversation:', id);
    setConversations(prev => prev.filter(conv => conv.id !== id));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r">
          <SidebarContent>
            <ConversationHistory
              conversations={conversations}
              selectedConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onNewConversation={handleNewConversation}
            />
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SidebarTrigger>
                <div className="flex items-center gap-2">
                  <Scale className="w-6 h-6 text-primary" />
                  <div>
                    <h1 className="text-lg font-semibold">LexIA</h1>
                    <p className="text-xs text-muted-foreground">
                      Asistente Jurídico Especializado
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración
                </Button>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="p-4">
              <ApiKeyInput onApiKeySet={handleApiKeySet} />
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <Scale className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">¡Bienvenido a LexIA!</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Soy tu asistente jurídico especializado en Derecho español y europeo. 
                        Puedes consultarme sobre legislación, jurisprudencia, procedimientos legales y más.
                      </p>
                      <div className="mt-6 text-sm text-muted-foreground">
                        <p className="font-medium mb-2">Ejemplos de consultas:</p>
                        <ul className="space-y-1 text-left max-w-lg mx-auto">
                          <li>• "¿Cuáles son los plazos para interponer un recurso contencioso-administrativo?"</li>
                          <li>• "Explica el régimen jurídico de las cláusulas abusivas según el TSJUE"</li>
                          <li>• "¿Qué requisitos debe cumplir un contrato de trabajo temporal?"</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))}
                      {isLoading && (
                        <div className="flex gap-3 p-4">
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                            <Scale className="w-4 h-4 text-accent-foreground" />
                          </div>
                          <div className="bg-muted rounded-lg rounded-bl-sm p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Chat Input */}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatInterface;
