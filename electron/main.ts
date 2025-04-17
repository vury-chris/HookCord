import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as crypto from 'crypto';
import axios from 'axios';
import Store from 'electron-store';
import FormData from 'form-data';

// Initialize store for webhooks data
const store = new Store({
  name: 'discord-webhook-manager',
  defaults: {
    webhooks: []
  }
});

// Create main window
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#2F3136', // Discord-like dark theme
    icon: path.join(__dirname, '../assets/icons', process.platform === 'win32' ? 'icon.ico' : process.platform === 'darwin' ? 'icon.icns' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
  
  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// Initialize app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for webhook management
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

// Helper function to send messages with files
async function sendMessageWithFiles(data) {
  try {
    console.log('Sending message with files to Discord webhook:', data.url);
    
    const form = new FormData();
    const payload: any = {};
    
    if (data.content) {
      payload.content = data.content;
    }
    
    if (data.username) {
      payload.username = data.username;
    }
    
    if (data.avatar_url && (!data.avatar_url.startsWith('data:'))) {
      payload.avatar_url = data.avatar_url;
    }
    
    if (data.embeds && data.embeds.length > 0) {
      payload.embeds = data.embeds;
    }
    
    console.log('Message payload:', JSON.stringify(payload));
    
    form.append('payload_json', JSON.stringify(payload));
    
    if (data.files && data.files.length > 0) {
      console.log(`Adding ${data.files.length} files to the form`);
      
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        
        try {
          if (file && file.data) {
            const buffer = Buffer.from(file.data, 'base64');
            
            console.log(`Adding file ${i}: ${file.name} (${buffer.length} bytes, type: ${file.type})`);
            
            form.append(`file${i}`, buffer, {
              filename: file.name,
              contentType: file.type
            });
          } else {
            console.error(`File ${i} is missing data property`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${i}:`, fileError);
        }
      }
    }
    
    console.log('Sending request to Discord API');
    const response = await axios.post(data.url, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('Discord response status:', response.status);
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

// IPC Handlers for sending messages
ipcMain.handle('send-message', async (_, url, message) => {
  try {
    console.log('Sending message to Discord webhook:', url);

    if (message.files && message.files.length > 0) {
      const messageData = {
        url,
        content: message.content,
        username: message.username,
        avatar_url: message.avatar_url,
        embeds: message.embeds,
        files: message.files
      };
      
      return await sendMessageWithFiles(messageData);
    } else {
      console.log('Message payload:', JSON.stringify(message));
      const response = await axios.post(url, message);
      console.log('Discord response status:', response.status);
      
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

// IPC Handler for sending messages with files
ipcMain.handle('send-message-with-files', async (_, data) => {
  try {
    return await sendMessageWithFiles(data);
  } catch (error) {
    console.error('Error in send-message-with-files handler:', error);
    return false;
  }
});