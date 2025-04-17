import React, { useState } from 'react';
import { Webhook } from '../../App';
import MessageInput from './MessageInput';
import EmbedBuilder from './EmbedBuilder';

interface EmbedCreatorProps {
  webhook: Webhook;
  onSend: (message: any) => Promise<boolean>;
  onBack: () => void;
}

// Discord embed interface
export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

// Discord message interface
export interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
  files?: File[];
}

const EmbedCreator: React.FC<EmbedCreatorProps> = ({
  webhook,
  onSend,
  onBack
}) => {
  const [message, setMessage] = useState<string>('');
  const [embed, setEmbed] = useState<DiscordEmbed | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [embedAttachments, setEmbedAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Enable/disable embed creation
  const [useEmbed, setUseEmbed] = useState<boolean>(false);

  // Helper to extract filename from attachment URL
  const getFilenameFromUrl = (url: string): string | null => {
    if (!url || !url.startsWith('attachment://')) return null;
    return url.replace('attachment://', '');
  };

  // Handle file selection for message attachments
  const handleFileSelect = (files: File[]) => {
    // Limit to 10 files or 50MB total (Discord's limit is actually 25MB for free users)
    const maxFiles = 10;
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    
    let totalSize = 0;
    for (const file of [...selectedFiles, ...files]) {
      totalSize += file.size;
    }
    
    if (selectedFiles.length + files.length > maxFiles) {
      alert(`You can only attach up to ${maxFiles} files.`);
      return;
    }
    
    if (totalSize > maxSize) {
      alert(`Total attachment size cannot exceed 50MB.`);
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...files]);
  };

  // Handle removing a file from the message
  const handleFileRemove = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  // Handle file uploads from embed builder
  const handleEmbedFileUpload = (file: File, fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    // Check if we already have a file with the same name (replacing it)
    const filteredFiles = embedAttachments.filter(f => f.name !== file.name);
    
    // Add the new file
    setEmbedAttachments([...filteredFiles, file]);
  };

  // Handle file removal from embed builder
  const handleEmbedFileRemove = (fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    // Determine which file to remove based on the attachment URL in the embed
    if (!embed) return;

    let filenameToRemove: string | null = null;

    switch (fileType) {
      case 'thumbnail':
        if (embed.thumbnail) {
          filenameToRemove = getFilenameFromUrl(embed.thumbnail.url);
        }
        break;
      case 'image':
        if (embed.image) {
          filenameToRemove = getFilenameFromUrl(embed.image.url);
        }
        break;
      case 'author_icon':
        if (embed.author && embed.author.icon_url) {
          filenameToRemove = getFilenameFromUrl(embed.author.icon_url);
        }
        break;
      case 'footer_icon':
        if (embed.footer && embed.footer.icon_url) {
          filenameToRemove = getFilenameFromUrl(embed.footer.icon_url);
        }
        break;
    }

    if (filenameToRemove) {
      // Remove the file from embedAttachments
      const updatedAttachments = embedAttachments.filter(file => 
        file.name !== filenameToRemove
      );
      setEmbedAttachments(updatedAttachments);
    }
  };

  const handleSend = async () => {
    // Validate if at least message, files, or embed is provided
    if (!message && selectedFiles.length === 0 && !useEmbed) {
      setSendError('Please provide a message, attach files, or create an embed');
      return;
    }

    // Prepare the Discord message payload
    const payload: DiscordMessage = {};
    
    // Add message content if provided
    if (message) {
      payload.content = message;
    }
    
    // Add embed if enabled and created
    if (useEmbed && embed) {
      payload.embeds = [embed];
    }
    
    // Combine all files for upload
    const allFiles = [
      ...selectedFiles,
      ...embedAttachments
    ];
    
    // Add files if selected
    if (allFiles.length > 0) {
      payload.files = allFiles;
    }

    // Use webhook avatar if available
    if (webhook.avatarUrl) {
      // Only use the avatar URL if it's not a data URL
      if (!webhook.avatarUrl.startsWith('data:')) {
        payload.avatar_url = webhook.avatarUrl;
      }
      // Always set username from webhook
      payload.username = webhook.name;
    }
    
    // Reset status
    setSendError(null);
    setSendSuccess(false);
    setIsSending(true);
    
    try {
      // Send the message
      const success = await onSend(payload);
      
      if (success) {
        setSendSuccess(true);
        // Clear message and files after successful send
        setMessage('');
        setSelectedFiles([]);
        // Don't clear embed for potential reuse
      }
    } catch (error) {
      setSendError('Failed to send the message. Please check your webhook URL and try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="embed-creator">
      <div className="creator-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Library
        </button>
        <h1>Message Creator</h1>
        <div className="webhook-info">
          {webhook.avatarUrl ? (
            <img src={webhook.avatarUrl} alt="Webhook avatar" className="webhook-avatar" />
          ) : (
            <div className="webhook-avatar-placeholder">
              {webhook.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="webhook-name">{webhook.name}</span>
        </div>
      </div>
      
      {sendError && (
        <div className="error-message">
          {sendError}
        </div>
      )}
      
      {sendSuccess && (
        <div className="success-message">
          Message sent successfully!
        </div>
      )}
      
      <div className="creator-content">
        <div className="message-section">
          <MessageInput 
            value={message} 
            onChange={setMessage}
            onFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
          />
          
          <div className="embed-toggle">
            <label>
              <input
                type="checkbox"
                checked={useEmbed}
                onChange={(e) => setUseEmbed(e.target.checked)}
              />
              Include Embed
            </label>
          </div>
        </div>
        
        {useEmbed && (
          <div className="embed-section">
            <EmbedBuilder
              embed={embed}
              onChange={setEmbed}
              onFileUpload={handleEmbedFileUpload}
              onFileRemove={handleEmbedFileRemove}
            />
          </div>
        )}
      </div>
      
      <div className="creator-actions">
        <button 
          onClick={handleSend}
          disabled={isSending || (!message && selectedFiles.length === 0 && (!useEmbed || !embed))}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      <style jsx>{`
        .embed-creator {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: var(--spacing-lg);
        }

        .creator-header {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .back-button {
          margin-right: var(--spacing-md);
        }

        h1 {
          flex-grow: 1;
        }

        .webhook-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--background-tertiary);
          border-radius: var(--radius-md);
        }

        .webhook-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .webhook-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .webhook-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .error-message {
          background-color: var(--danger);
          color: white;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }

        .success-message {
          background-color: var(--success);
          color: white;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }

        .creator-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          flex-grow: 1;
          overflow-y: auto;
          max-height: calc(100vh - 200px); /* Adjust based on header and footer heights */
          padding-right: var(--spacing-sm); /* Add some padding for the scrollbar */
        }

        .message-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .embed-toggle {
          display: flex;
          align-items: center;
        }

        .embed-toggle label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .embed-section {
          background-color: var(--background-secondary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }

        .creator-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--spacing-lg);
          position: sticky;
          bottom: 0;
          background-color: var(--background);
          padding-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
};

export default EmbedCreator;