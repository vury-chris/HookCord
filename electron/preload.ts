import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
  'api',
  {
    getWebhooks: () => ipcRenderer.invoke('get-webhooks'),
    
    saveWebhook: (webhook: { 
      url: string; 
      name: string; 
      avatarUrl?: string 
    }) => ipcRenderer.invoke('save-webhook', webhook),
    
    updateWebhook: (webhookId: string, webhookData: any) => 
      ipcRenderer.invoke('update-webhook', webhookId, webhookData),
    
    updateWebhookUsage: (webhookId: string) => 
      ipcRenderer.invoke('update-webhook-usage', webhookId),
    
    deleteWebhook: (webhookId: string) =>
      ipcRenderer.invoke('delete-webhook', webhookId),
    
    sendMessage: (url: string, message: any) => 
      ipcRenderer.invoke('send-message', url, message),
    
    sendMessageWithFiles: (messageData: any) => 
      ipcRenderer.invoke('send-message-with-files', messageData)
  }
);