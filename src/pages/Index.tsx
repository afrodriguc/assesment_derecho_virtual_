
import React, { useState } from 'react';
import AuthScreen from '@/components/AuthScreen';
import ChatInterface from '@/components/ChatInterface';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // TODO: Limpiar sesión de Supabase
    console.log('Logout - clearing Supabase session');
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <ChatInterface onLogout={handleLogout} />;
};

export default Index;
