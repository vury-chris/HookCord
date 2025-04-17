import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebhookLibrary from './components/library/WebhookLibrary';
import EmbedCreator from './components/EmbedCreator/EmbedCreator';

// Types
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

  // Load webhooks on initial mount
  useEffect(() => {
    loadWebhooks();
  }, []);

  // Load webhooks from storage
  const loadWebhooks = async () => {
    try {
      const data = await window.api.getWebhooks();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  // Save a new webhook
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

  // Delete a webhook
  const deleteWebhook = async (webhookId: string) => {
    try {
      await window.api.deleteWebhook(webhookId);
      
      // Update the local state after deletion
      const updatedWebhooks = webhooks.filter(webhook => webhook.id !== webhookId);
      setWebhooks(updatedWebhooks);
      
      // If the deleted webhook was selected, reset selectedWebhook
      if (selectedWebhook && selectedWebhook.id === webhookId) {
        setSelectedWebhook(null);
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  };

  // Handle webhook selection
  const selectWebhook = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    navigate('/creator');
  };

  // Update webhook last used timestamp
  const updateWebhookUsage = async (webhookId: string) => {
    try {
      await window.api.updateWebhookUsage(webhookId);
      // Refresh webhooks after usage update
      loadWebhooks();
    } catch (error) {
      console.error('Failed to update webhook usage:', error);
    }
  };

  // Prepare a file for IPC transfer
  const prepareFileForIPC = async (file: File) => {
    // Convert File to simple object with properties that can be serialized
    const arrayBuffer = await file.arrayBuffer();
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      // Convert ArrayBuffer to Base64 for safe IPC transfer
      data: arrayBufferToBase64(arrayBuffer)
    };
  };

  // Helper to convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Send message using webhook
  const sendMessage = async (message: any) => {
    if (!selectedWebhook) return false;
    
    try {
      // Create a copy of the message without including the webhook's avatar_url
      const messageToSend = { ...message };
      
      // If the avatarUrl is a data URL, it's too long for Discord
      // For webhook avatars, we should set the username but not try to use a data URL avatar
      if (selectedWebhook.avatarUrl && selectedWebhook.avatarUrl.startsWith('data:')) {
        // Set the username from the webhook but don't set avatar_url
        messageToSend.username = selectedWebhook.name;
        // Remove any avatar_url that might be set
        delete messageToSend.avatar_url;
      } else if (selectedWebhook.avatarUrl) {
        // Only use the avatar_url if it's a proper URL (not a data URL)
        messageToSend.avatar_url = selectedWebhook.avatarUrl;
        messageToSend.username = selectedWebhook.name;
      }
      
      // Prepare files for IPC transfer if they exist
      let success = false;
      
      if (message.files && message.files.length > 0) {
        // Convert File objects to transferable data
        const preparedFiles = await Promise.all(
          message.files.map(file => prepareFileForIPC(file))
        );
        
        const messageData = {
          url: selectedWebhook.url,
          content: messageToSend.content,
          username: messageToSend.username,
          avatar_url: messageToSend.avatar_url, 
          embeds: messageToSend.embeds,
          files: preparedFiles // Send prepared files instead of File objects
        };
        
        success = await window.api.sendMessageWithFiles(messageData);
      } else {
        // Simple JSON message without files
        success = await window.api.sendMessage(selectedWebhook.url, messageToSend);
      }
      
      // Update usage timestamp
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