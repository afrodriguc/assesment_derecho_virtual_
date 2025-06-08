
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export const useMessages = (userId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes",
          variant: "destructive",
        });
        return;
      }

      const formattedMessages = data.map(msg => ({
        ...msg,
        created_at: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Error al cargar mensajes",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        throw error;
      }

      const newMessage = {
        ...data,
        created_at: new Date(data.created_at)
      };

      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el mensaje",
        variant: "destructive",
      });
      throw error;
    }
  };

  const callOpenAI = async (userMessage: string) => {
    const apiKey = localStorage.getItem('user_api_key');
    if (!apiKey) {
      throw new Error('API Key no configurada');
    }

    // Preparar mensajes para OpenAI incluyendo el historial
    const openAIMessages = [
      {
        role: 'system',
        content: 'Eres LexIA, asistente jurídico especializado en Derecho español y europeo. Responde con lenguaje claro y, cuando proceda, menciona la norma o jurisprudencia aplicable.'
      },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openAIMessages,
        temperature: 0.4,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error de OpenAI: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const sendMessage = async (content: string) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem('user_api_key');
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Por favor, configura tu API Key de OpenAI primero",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Guardar mensaje del usuario
      await saveMessage('user', content);

      // Llamar a OpenAI
      const response = await callOpenAI(content);

      // Guardar respuesta del asistente
      await saveMessage('assistant', response);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del asistente. Verifica tu API Key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadMessages();
    }
  }, [userId]);

  return {
    messages,
    isLoading,
    sendMessage,
    loadMessages,
  };
};
