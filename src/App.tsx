import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebhookLibrary from './components/library/WebhookLibrary';
import EmbedCreator from './components/EmbedCreator/EmbedCreator';

export interface Webhook {
  id: string;
  url: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  lastUsed: string | null;
}

const App: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const data = await window.api.getWebhooks();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  const saveWebhook = async (url: string, name: string, avatarUrl?: string) => {
    try {
      const newWebhook = await window.api.saveWebhook({ url, name, avatarUrl });
      setWebhooks([...webhooks, newWebhook]);
      setSelectedWebhook(newWebhook);
      navigate('/creator');
      return newWebhook;
    } catch (error) {
      console.error('Failed to save webhook:', error);
      throw error;
    }
  };

  const updateWebhook = async (webhookId: string, name: string, avatarUrl?: string) => {
    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) throw new Error('Webhook not found');
      
      const updatedData = {
        ...webhook,
        name, 
        avatarUrl
      };
      
      const updatedWebhook = await window.api.updateWebhook(webhookId, updatedData);
      
      const updatedWebhooks = webhooks.map(w => 
        w.id === webhookId ? updatedWebhook : w
      );
      
      setWebhooks(updatedWebhooks);
      
      if (selectedWebhook && selectedWebhook.id === webhookId) {
        setSelectedWebhook(updatedWebhook);
      }
      
      return updatedWebhook;
    } catch (error) {
      console.error('Failed to update webhook:', error);
      throw error;
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      await window.api.deleteWebhook(webhookId);
      
      const updatedWebhooks = webhooks.filter(webhook => webhook.id !== webhookId);
      setWebhooks(updatedWebhooks);
      
      if (selectedWebhook && selectedWebhook.id === webhookId) {
        setSelectedWebhook(null);
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  };

  const selectWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    navigate('/creator');
  };

  const updateWebhookUsage = async (webhookId: string) => {
    try {
      await window.api.updateWebhookUsage(webhookId);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to update webhook usage:', error);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const prepareFileForIPC = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      data: arrayBufferToBase64(arrayBuffer)
    };
  };

  const isDataUrl = (url: string): boolean => {
    return url?.startsWith('data:');
  };

  const sendMessage = async (message: any) => {
    if (!selectedWebhook) return false;
    
    try {
      const messageToSend = { ...message };
      
      messageToSend.username = selectedWebhook.name;
      
      if (selectedWebhook.avatarUrl && !isDataUrl(selectedWebhook.avatarUrl)) {
        messageToSend.avatar_url = selectedWebhook.avatarUrl;
      }
      
      let success = false;
      
      if (message.files && message.files.length > 0) {
        const preparedFiles = await Promise.all(
          message.files.map((file: File) => prepareFileForIPC(file))
        );
        
        const messageData = {
          url: selectedWebhook.url,
          content: messageToSend.content,
          username: messageToSend.username,
          avatar_url: messageToSend.avatar_url, 
          embeds: messageToSend.embeds,
          files: preparedFiles
        };
        
        success = await window.api.sendMessageWithFiles(messageData);
      } else {
        success = await window.api.sendMessage(selectedWebhook.url, messageToSend);
      }
      
      if (success) {
        await updateWebhookUsage(selectedWebhook.id);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/" 
          element={
            <WebhookLibrary 
              webhooks={webhooks} 
              onSelect={selectWebhook} 
              onSave={saveWebhook}
              onDelete={deleteWebhook}
              onUpdate={updateWebhook}
            />
          } 
        />
        <Route 
          path="/creator" 
          element={
            selectedWebhook ? (
              <EmbedCreator 
                webhook={selectedWebhook} 
                onSend={sendMessage} 
                onBack={() => navigate('/')} 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
};

export default App;