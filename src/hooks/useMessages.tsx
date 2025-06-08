
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

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
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
      // 1️⃣ Insertar mensaje del usuario en Supabase
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          role: 'user',
          content: content
        })
        .select()
        .single();

      if (userError) {
        console.error('Error saving user message:', userError);
        throw new Error('No se pudo guardar el mensaje del usuario');
      }

      // Agregar mensaje del usuario al estado inmediatamente
      const newUserMessage: Message = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        created_at: new Date(userMessage.created_at)
      };
      setMessages(prev => [...prev, newUserMessage]);

      // 2️⃣ Recuperar historial completo desde Supabase
      const { data: allMessages, error: historyError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error loading message history:', historyError);
        throw new Error('No se pudo recuperar el historial');
      }

      // 3️⃣ Construir array de mensajes para OpenAI
      const openAIMessages = [
        {
          role: 'system',
          content: 'Eres LexIA, asistente jurídico especializado en Derecho español y europeo. Responde con lenguaje claro y, cuando proceda, menciona la norma o jurisprudencia aplicable.'
        },
        ...allMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // 4️⃣ Llamada a la API de OpenAI
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
        const errorData = await response.json().catch(() => null);
        console.error('OpenAI API Error:', response.status, errorData);
        throw new Error(`Error de OpenAI: ${response.status}. Verifica tu API Key.`);
      }

      const data = await response.json();
      const assistantResponse = data.choices?.[0]?.message?.content;

      if (!assistantResponse) {
        throw new Error('No se recibió respuesta válida de OpenAI');
      }

      // 5️⃣ Insertar respuesta del asistente en Supabase
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: assistantResponse
        })
        .select()
        .single();

      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
        throw new Error('No se pudo guardar la respuesta del asistente');
      }

      // 6️⃣ Actualizar estado del chat con la respuesta del asistente
      const newAssistantMessage: Message = {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        created_at: new Date(assistantMessage.created_at)
      };
      setMessages(prev => [...prev, newAssistantMessage]);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo obtener respuesta del asistente",
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
