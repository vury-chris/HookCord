import { DiscordMessage } from '../components/EmbedCreator/EmbedCreator';

/**
 * Service for webhook validation and handling
 */
export const webhookService = {
  /**
   * Validates a Discord webhook URL
   * @param url - The webhook URL to validate
   * @returns Boolean indicating if the URL is valid
   */
  isValidWebhookUrl(url: string): boolean {
    // Discord webhook URL pattern validation
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return discordWebhookRegex.test(url);
  },

  /**
   * Retrieves all stored webhooks
   * @returns Promise resolving to an array of webhooks
   */
  async getWebhooks() {
    try {
      return await window.api.getWebhooks();
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  },

  /**
   * Saves a new webhook
   * @param url - Discord webhook URL
   * @param name - User-friendly name for the webhook
   * @returns Promise resolving to the newly created webhook
   */
  async saveWebhook(url: string, name: string) {
    if (!this.isValidWebhookUrl(url)) {
      throw new Error('Invalid Discord webhook URL');
    }

    try {
      return await window.api.saveWebhook({ url, name });
    } catch (error) {
      console.error('Error saving webhook:', error);
      throw error;
    }
  },

  /**
   * Updates the last used timestamp for a webhook
   * @param webhookId - ID of the webhook to update
   * @returns Promise resolving to a boolean indicating success
   */
  async updateWebhookUsage(webhookId: string) {
    try {
      return await window.api.updateWebhookUsage(webhookId);
    } catch (error) {
      console.error('Error updating webhook usage:', error);
      throw error;
    }
  },

  /**
   * Sends a message to a Discord webhook
   * @param url - Discord webhook URL
   * @param message - Message payload to send
   * @returns Promise resolving to a boolean indicating success
   */
  async sendMessage(url: string, message: DiscordMessage) {
    if (!this.isValidWebhookUrl(url)) {
      throw new Error('Invalid Discord webhook URL');
    }

    try {
      return await window.api.sendMessage(url, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}