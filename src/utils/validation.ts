/**
 * Validates a Discord webhook URL
 * @param url - Discord webhook URL to validate
 * @returns Boolean indicating if the URL matches Discord webhook format
 */
export const isValidDiscordWebhook = (url: string): boolean => {
    if (!url) return false;
    
    // Discord webhook URL pattern
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return discordWebhookRegex.test(url);
  };
  
  /**
   * Validates an embed object to ensure it meets Discord's requirements
   * @param embed - Discord embed object to validate
   * @returns An object with isValid boolean and optional error message
   */
  export const validateEmbed = (embed: any): { isValid: boolean; error?: string } => {
    // Check if embed is empty
    if (!embed) {
      return { isValid: false, error: 'Embed cannot be empty' };
    }
  
    // Check title length (max 256 characters)
    if (embed.title && embed.title.length > 256) {
      return { isValid: false, error: 'Embed title must be 256 characters or less' };
    }
  
    // Check description length (max 4096 characters)
    if (embed.description && embed.description.length > 4096) {
      return { isValid: false, error: 'Embed description must be 4096 characters or less' };
    }
  
    // Check fields (max 25 fields)
    if (embed.fields && embed.fields.length > 25) {
      return { isValid: false, error: 'Embed can have at most 25 fields' };
    }
  
    // Check field values
    if (embed.fields && embed.fields.length > 0) {
      for (let i = 0; i < embed.fields.length; i++) {
        const field = embed.fields[i];
        
        // Field name must be present and max 256 characters
        if (!field.name || field.name.length > 256) {
          return { 
            isValid: false, 
            error: `Field ${i + 1} name must be present and 256 characters or less` 
          };
        }
        
        // Field value must be present and max 1024 characters
        if (!field.value || field.value.length > 1024) {
          return { 
            isValid: false, 
            error: `Field ${i + 1} value must be present and 1024 characters or less` 
          };
        }
      }
    }
  
    // Check footer text length (max 2048 characters)
    if (embed.footer && embed.footer.text && embed.footer.text.length > 2048) {
      return { isValid: false, error: 'Footer text must be 2048 characters or less' };
    }
  
    // Check author name length (max 256 characters)
    if (embed.author && embed.author.name && embed.author.name.length > 256) {
      return { isValid: false, error: 'Author name must be 256 characters or less' };
    }
  
    // Check total embed character count (max 6000 characters)
    let totalCharCount = 0;
    
    if (embed.title) totalCharCount += embed.title.length;
    if (embed.description) totalCharCount += embed.description.length;
    
    if (embed.fields) {
      for (const field of embed.fields) {
        if (field.name) totalCharCount += field.name.length;
        if (field.value) totalCharCount += field.value.length;
      }
    }
    
    if (embed.footer && embed.footer.text) totalCharCount += embed.footer.text.length;
    if (embed.author && embed.author.name) totalCharCount += embed.author.name.length;
    
    if (totalCharCount > 6000) {
      return { isValid: false, error: 'Total embed character count must be 6000 or less' };
    }
  
    return { isValid: true };
  };