import { Webhook } from '../App';

/**
 * Service for local storage operations
 * This is a wrapper around the IPC calls to main process
 */
export const storageService = {
  /**
   * Gets all webhooks from storage
   * @returns Promise resolving to array of webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    try {
      const data = await window.api.getWebhooks();
      return data.webhooks || [];
    } catch (error) {
      console.error('Error fetching webhooks from storage:', error);
      return [];
    }
  },

  /**
   * Saves a webhook to storage
   * @param url - Discord webhook URL
   * @param name - User-friendly name for the webhook
   * @returns Promise resolving to the created webhook
   */
  async saveWebhook(url: string, name: string): Promise<Webhook> {
    try {
      return await window.api.saveWebhook({ url, name });
    } catch (error) {
      console.error('Error saving webhook to storage:', error);
      throw error;
    }
  },

  /**
   * Updates the last used timestamp for a webhook
   * @param webhookId - ID of the webhook to update
   * @returns Promise resolving to boolean indicating success
   */
  async updateWebhookUsage(webhookId: string): Promise<boolean> {
    try {
      return await window.api.updateWebhookUsage(webhookId);
    } catch (error) {
      console.error('Error updating webhook usage in storage:', error);
      return false;
    }
  }
};