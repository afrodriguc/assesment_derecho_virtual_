
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isKeySet, setIsKeySet] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('user_api_key');
    
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
      onApiKeySet();
    }
  }, [onApiKeySet]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('user_api_key', apiKey.trim());
      setIsKeySet(true);
      onApiKeySet();
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('user_api_key');
    setApiKey('');
    setIsKeySet(false);
  };

  if (isKeySet) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">API Key de OpenAI configurada</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearKey}>
              Cambiar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Key className="w-5 h-5 text-amber-600" />
          Configuración de API Key de OpenAI
        </CardTitle>
        <CardDescription className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span>
            Tu API Key se almacena localmente y no se envía a nuestros servidores.
            Es necesaria para conectar con OpenAI.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key de OpenAI</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <Button onClick={handleSaveKey} disabled={!apiKey.trim()} className="w-full">
          Guardar API Key
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Obtén tu API Key en platform.openai.com</p>
          <p>• Se usa el modelo GPT-4o para respuestas especializadas</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput;
