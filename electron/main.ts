import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import Store from 'electron-store';
import FormData from 'form-data';

const store = new Store({
  name: 'discord-webhook-manager',
  defaults: {
    webhooks: []
  }
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#2F3136',
    icon: path.join(__dirname, '../assets/images/icons', process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    frame: true
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-webhooks', async () => {
  return { webhooks: store.get('webhooks') };
});

ipcMain.handle('save-webhook', async (_, webhookData) => {
  const { url, name, avatarUrl } = webhookData;
  
  const id = crypto.randomUUID();
  
  const webhook = {
    id,
    url,
    name,
    avatarUrl,
    createdAt: new Date().toISOString(),
    lastUsed: null
  };
  
  const webhooks = store.get('webhooks') as any[];
  store.set('webhooks', [...webhooks, webhook]);
  
  return webhook;
});

ipcMain.handle('update-webhook', async (_, webhookId, webhookData) => {
  const webhooks = store.get('webhooks') as any[];
  const index = webhooks.findIndex(webhook => webhook.id === webhookId);
  
  if (index === -1) {
    throw new Error('Webhook not found');
  }
  
  const updatedWebhook = {
    ...webhooks[index],
    name: webhookData.name,
    avatarUrl: webhookData.avatarUrl
  };
  
  webhooks[index] = updatedWebhook;
  store.set('webhooks', webhooks);
  
  return updatedWebhook;
});

ipcMain.handle('update-webhook-usage', async (_, webhookId) => {
  const webhooks = store.get('webhooks') as any[];
  const updatedWebhooks = webhooks.map(webhook => {
    if (webhook.id === webhookId) {
      return {
        ...webhook,
        lastUsed: new Date().toISOString()
      };
    }
    return webhook;
  });
  
  store.set('webhooks', updatedWebhooks);
  return true;
});

ipcMain.handle('delete-webhook', async (_, webhookId) => {
  const webhooks = store.get('webhooks') as any[];
  const updatedWebhooks = webhooks.filter(webhook => webhook.id !== webhookId);
  
  store.set('webhooks', updatedWebhooks);
  return true;
});

const isDataUrl = (url: string): boolean => {
  return url?.startsWith('data:');
};

async function sendMessageWithFiles(data) {
  try {
    const form = new FormData();
    const payload: any = {};
    
    if (data.content) {
      payload.content = data.content;
    }
    
    if (data.username) {
      payload.username = data.username;
    }
    
    if (data.avatar_url && !isDataUrl(data.avatar_url)) {
      payload.avatar_url = data.avatar_url;
    }
    
    if (data.embeds && data.embeds.length > 0) {
      const validatedEmbeds = data.embeds.map(embed => {
        const validEmbed = { ...embed };
        
        if (validEmbed.fields && Array.isArray(validEmbed.fields)) {
          validEmbed.fields = validEmbed.fields.map(field => ({
            name: field.name || '',
            value: field.value || '',
            inline: field.inline || false
          }));
        }
        
        return validEmbed;
      });
      
      payload.embeds = validatedEmbeds;
    }
    
    form.append('payload_json', JSON.stringify(payload));
    
    if (data.files && data.files.length > 0) {
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        
        if (file && file.data) {
          const buffer = Buffer.from(file.data, 'base64');
          
          form.append(`file${i}`, buffer, {
            filename: file.name,
            contentType: file.type
          });
        }
      }
    }
    
    const response = await axios.post(data.url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    return response.status === 204;
  } catch (error) {
    console.error('Error sending message with files:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

ipcMain.handle('send-message', async (_, url, message) => {
  try {
    const messageToSend = { ...message };
    
    if (messageToSend.avatar_url && isDataUrl(messageToSend.avatar_url)) {
      delete messageToSend.avatar_url;
    }
    
    if (message.files && message.files.length > 0) {
      const messageData = {
        url,
        content: messageToSend.content,
        username: messageToSend.username,
        avatar_url: messageToSend.avatar_url,
        embeds: messageToSend.embeds,
        files: message.files
      };
      
      return await sendMessageWithFiles(messageData);
    } else {
      const response = await axios.post(url, messageToSend);
      return response.status === 204;
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
});

ipcMain.handle('send-message-with-files', async (_, data) => {
  try {
    return await sendMessageWithFiles(data);
  } catch (error) {
    console.error('Error in send-message-with-files handler:', error);
    return false;
  }
});