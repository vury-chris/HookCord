import { DiscordMessage } from '../components/EmbedCreator/EmbedCreator';

// Global type declarations
declare global {
  interface Window {
    api: {
      getWebhooks: () => Promise<{ webhooks: any[] }>;
      saveWebhook: (webhook: { url: string; name: string; avatarUrl?: string }) => Promise<any>;
      updateWebhookUsage: (webhookId: string) => Promise<boolean>;
      deleteWebhook: (webhookId: string) => Promise<boolean>;
      sendMessage: (url: string, message: DiscordMessage) => Promise<boolean>;
      sendMessageWithFiles: (messageData: any) => Promise<boolean>;
    };
  }
}

// This empty export is needed to make this a module
export {};