import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api',
  {
    // Webhooks management
    getWebhooks: () => ipcRenderer.invoke('get-webhooks'),
    saveWebhook: (webhook: { url: string; name: string; avatarUrl?: string }) => 
      ipcRenderer.invoke('save-webhook', webhook),
    updateWebhookUsage: (webhookId: string) => 
      ipcRenderer.invoke('update-webhook-usage', webhookId),
    deleteWebhook: (webhookId: string) =>
      ipcRenderer.invoke('delete-webhook', webhookId),
    
    // Message sending
    sendMessage: (url: string, message: any) => 
      ipcRenderer.invoke('send-message', url, message),
    sendMessageWithFiles: (messageData: any) => 
      ipcRenderer.invoke('send-message-with-files', messageData)
  }
);