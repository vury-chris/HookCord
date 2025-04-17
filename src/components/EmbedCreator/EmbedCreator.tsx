import React, { useState } from 'react';
import { Webhook } from '../../App';
import MessageInput from './MessageInput';
import EmbedBuilder from './EmbedBuilder';
import { validateEmbed } from '../../utils/validation';

interface EmbedCreatorProps {
  webhook: Webhook;
  onSend: (message: any) => Promise<boolean>;
  onBack: () => void;
}

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
  const [embeds, setEmbeds] = useState<DiscordEmbed[]>([]);
  const [selectedEmbedIndices, setSelectedEmbedIndices] = useState<number[]>([]);
  const [expandedEmbedIndex, setExpandedEmbedIndex] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [embedAttachments, setEmbedAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [useEmbed, setUseEmbed] = useState<boolean>(false);

  const getFilenameFromUrl = (url: string): string | null => {
    if (!url || !url.startsWith('attachment://')) return null;
    return url.replace('attachment://', '');
  };

  const handleFileSelect = (files: File[]) => {
    const maxFiles = 10;
    const maxSize = 50 * 1024 * 1024;
    
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

  const handleFileRemove = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const toggleEmbedSelection = (index: number) => {
    setSelectedEmbedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const addEmbed = () => {
    if (embeds.length >= 10) {
      alert('Discord allows a maximum of 10 embeds per message.');
      return;
    }
    
    const newEmbed: DiscordEmbed = {
      title: '',
      description: '',
      color: undefined,
      fields: [],
    };
    
    const newEmbeds = [...embeds, newEmbed];
    setEmbeds(newEmbeds);
    
    const newIndex = newEmbeds.length - 1;
    setSelectedEmbedIndices(prev => [...prev, newIndex]);
    setExpandedEmbedIndex(newIndex);
  };

  const removeEmbed = (index: number) => {
    const newEmbeds = [...embeds];
    newEmbeds.splice(index, 1);
    setEmbeds(newEmbeds);
    
    setSelectedEmbedIndices(prev => {
      const filtered = prev.filter(i => i !== index);
      return filtered.map(i => i > index ? i - 1 : i);
    });
    
    if (expandedEmbedIndex === index) {
      setExpandedEmbedIndex(null);
    } else if (expandedEmbedIndex !== null && expandedEmbedIndex > index) {
      setExpandedEmbedIndex(expandedEmbedIndex - 1);
    }
  };

  const updateEmbed = (index: number, updatedEmbed: DiscordEmbed) => {
    const newEmbeds = [...embeds];
    newEmbeds[index] = updatedEmbed;
    setEmbeds(newEmbeds);
  };

  const toggleEmbedExpansion = (index: number) => {
    if (expandedEmbedIndex === index) {
      setExpandedEmbedIndex(null);
    } else {
      setExpandedEmbedIndex(index);
    }
  };

  const handleEmbedFileUpload = (file: File, fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon', embedIndex: number) => {
    const filteredFiles = embedAttachments.filter(f => f.name !== file.name);
    setEmbedAttachments([...filteredFiles, file]);
  };

  const handleEmbedFileRemove = (fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon', embedIndex: number) => {
    if (embedIndex >= embeds.length) return;
    const embed = embeds[embedIndex];

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
      const updatedAttachments = embedAttachments.filter(file => 
        file.name !== filenameToRemove
      );
      setEmbedAttachments(updatedAttachments);
    }
  };

  const validateSelectedEmbeds = (): { isValid: boolean; error?: string } => {
    if (selectedEmbedIndices.length === 0) {
      return { isValid: false, error: 'Please select at least one embed to send.' };
    }
    
    for (const index of selectedEmbedIndices) {
      if (index >= embeds.length) continue;
      
      const result = validateEmbed(embeds[index]);
      if (!result.isValid) {
        return { isValid: false, error: `Embed #${index + 1}: ${result.error}` };
      }
    }
    
    if (selectedEmbedIndices.length > 10) {
      return { isValid: false, error: 'Discord allows a maximum of 10 embeds per message.' };
    }
    
    return { isValid: true };
  };

  const handleSend = async () => {
    if (!message && selectedFiles.length === 0 && (!useEmbed || selectedEmbedIndices.length === 0)) {
      setSendError('Please provide a message, attach files, or select at least one embed');
      return;
    }

    if (useEmbed && selectedEmbedIndices.length > 0) {
      const validation = validateSelectedEmbeds();
      if (!validation.isValid) {
        setSendError(validation.error);
        return;
      }
    }

    const payload: DiscordMessage = {};
    
    if (message) {
      payload.content = message;
    }
    
    if (useEmbed && selectedEmbedIndices.length > 0) {
      payload.embeds = selectedEmbedIndices
        .sort((a, b) => a - b)
        .map(index => embeds[index])
        .filter(embed => {
          return embed.title || embed.description || 
                 (embed.fields && embed.fields.length > 0) ||
                 embed.image || embed.thumbnail ||
                 embed.author || embed.footer;
        });
    }
    
    const selectedEmbedFiles = embedAttachments.filter(file => {
      for (const index of selectedEmbedIndices) {
        const embed = embeds[index];
        if (!embed) continue;
        
        if (embed.thumbnail && getFilenameFromUrl(embed.thumbnail.url) === file.name) {
          return true;
        }
        
        if (embed.image && getFilenameFromUrl(embed.image.url) === file.name) {
          return true;
        }
        
        if (embed.author && embed.author.icon_url && 
            getFilenameFromUrl(embed.author.icon_url) === file.name) {
          return true;
        }
        
        if (embed.footer && embed.footer.icon_url && 
            getFilenameFromUrl(embed.footer.icon_url) === file.name) {
          return true;
        }
      }
      
      return false;
    });
    
    const allFiles = [
      ...selectedFiles,
      ...selectedEmbedFiles
    ];
    
    if (allFiles.length > 0) {
      payload.files = allFiles;
    }

    if (webhook.avatarUrl) {
      if (!webhook.avatarUrl.startsWith('data:')) {
        payload.avatar_url = webhook.avatarUrl;
      }
      payload.username = webhook.name;
    }
    
    setSendError(null);
    setSendSuccess(false);
    setIsSending(true);
    
    try {
      const success = await onSend(payload);
      
      if (success) {
        setSendSuccess(true);
        setMessage('');
        setSelectedFiles([]);
      }
    } catch (error) {
      setSendError('Failed to send the message. Please check your webhook URL and try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUseEmbedToggle = (value: boolean) => {
    setUseEmbed(value);
    if (value && embeds.length === 0) {
      addEmbed();
    }
  };

  const toggleSelectAllEmbeds = () => {
    if (selectedEmbedIndices.length === embeds.length) {
      setSelectedEmbedIndices([]);
    } else {
      setSelectedEmbedIndices(embeds.map((_, i) => i));
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
                onChange={(e) => handleUseEmbedToggle(e.target.checked)}
              />
              Include Embeds
            </label>
          </div>
        </div>
        
        {useEmbed && (
          <div className="embeds-container">
            {embeds.length > 0 ? (
              <>
                <div className="embeds-header">
                  <div className="embeds-title-area">
                    <h3>Embeds ({embeds.length}/10)</h3>
                    {embeds.length > 1 && (
                      <button 
                        className="select-all-btn"
                        onClick={toggleSelectAllEmbeds}
                      >
                        {selectedEmbedIndices.length === embeds.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>
                  <button 
                    className="add-embed-btn"
                    onClick={addEmbed}
                    disabled={embeds.length >= 10}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                
                <div className="embeds-list">
                  {embeds.map((embed, index) => (
                    <div key={index} className="embed-item">
                      <div className="embed-item-header">
                        <div className="embed-selection">
                          <label className="discord-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedEmbedIndices.includes(index)}
                              onChange={() => toggleEmbedSelection(index)}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </div>
                        
                        <div 
                          className={`embed-preview-header ${!selectedEmbedIndices.includes(index) ? 'disabled' : ''}`}
                          onClick={() => toggleEmbedExpansion(index)}
                        >
                          <div className="embed-preview" style={{ borderLeftColor: embed.color ? `#${embed.color.toString(16)}` : '#202225' }}>
                            <div className="embed-title-preview">
                              {embed.title || 'Untitled Embed'}
                            </div>
                            {embed.description && (
                              <div className="embed-description-preview">
                                {embed.description.length > 60 
                                  ? embed.description.substring(0, 60) + '...' 
                                  : embed.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="embed-actions">
                          <button 
                            className="expand-toggle"
                            onClick={() => toggleEmbedExpansion(index)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              {expandedEmbedIndex === index ? (
                                <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              ) : (
                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              )}
                            </svg>
                          </button>
                          <button 
                            className="remove-embed"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeEmbed(index);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {expandedEmbedIndex === index && (
                        <div className="embed-content">
                          <EmbedBuilder
                            embed={embed}
                            onChange={(updatedEmbed) => updateEmbed(index, updatedEmbed)}
                            onFileUpload={(file, fileType) => handleEmbedFileUpload(file, fileType, index)}
                            onFileRemove={(fileType) => handleEmbedFileRemove(fileType, index)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {embeds.length < 10 && (
                  <div className="add-embed-container">
                    <button 
                      className="add-embed-btn-large"
                      onClick={addEmbed}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add Embed
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-embeds">
                <button 
                  className="add-first-embed"
                  onClick={addEmbed}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>Add your first embed</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="creator-actions">
        <button 
          onClick={handleSend}
          disabled={isSending || (!message && selectedFiles.length === 0 && (!useEmbed || selectedEmbedIndices.length === 0))}
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
          max-height: calc(100vh - 200px);
          padding-right: var(--spacing-sm);
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

        .embeds-container {
          background-color: var(--background-secondary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }

        .embeds-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .embeds-title-area {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .select-all-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          transition: background-color 0.2s, color 0.2s;
        }

        .select-all-btn:hover {
          background-color: var(--background-tertiary);
          color: var(--text-primary);
        }

        h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 600;
        }

        .add-embed-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--accent);
          color: white;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .add-embed-btn:hover {
          background-color: var(--button-primary-hover);
        }

        .add-embed-btn:disabled {
          background-color: var(--text-muted);
          cursor: not-allowed;
        }

        .embeds-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .embed-item {
          display: flex;
          flex-direction: column;
          background-color: var(--background-tertiary);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .embed-item-header {
          display: flex;
          align-items: center;
          background-color: var(--background);
          padding: var(--spacing-sm);
          cursor: pointer;
        }

        .embed-selection {
          display: flex;
          align-items: center;
          margin-right: var(--spacing-sm);
        }

        .discord-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          width: 24px;
          height: 24px;
        }

        .discord-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: relative;
          height: 20px;
          width: 20px;
          background-color: var(--background-secondary);
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .discord-checkbox:hover .checkmark {
          background-color: rgba(88, 101, 242, 0.2);
        }

        .discord-checkbox input:checked + .checkmark {
          background-color: var(--accent);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 7px;
          top: 3px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .discord-checkbox input:checked + .checkmark:after {
          display: block;
        }

        .embed-preview-header {
          display: flex;
          flex-grow: 1;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .embed-preview-header.disabled {
          opacity: 0.6;
        }

        .embed-preview {
          display: flex;
          flex-direction: column;
          padding: var(--spacing-sm) var(--spacing-md);
          border-left: 4px solid #202225;
          flex-grow: 1;
        }

        .embed-title-preview {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .embed-description-preview {
          color: var(--text-secondary);
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .embed-actions {
          display: flex;
          gap: var(--spacing-xs);
          margin-left: var(--spacing-sm);
        }

        .expand-toggle, .remove-embed {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background-color: var(--background-tertiary);
          color: var(--text-secondary);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }

        .expand-toggle:hover, .remove-embed:hover {
          background-color: var(--background-secondary);
          color: var(--text-primary);
        }

        .remove-embed:hover {
          color: var(--danger);
        }

        .embed-content {
          padding: var(--spacing-md);
          border-top: 1px solid var(--background);
          width: 100%;
        }

        .no-embeds {
          display: flex;
          justify-content: center;
          padding: var(--spacing-lg) 0;
        }

        .add-first-embed {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          background-color: transparent;
          color: var(--text-secondary);
          border: 2px dashed var(--text-muted);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg) var(--spacing-xl);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .add-first-embed:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }

        .add-embed-container {
          display: flex;
          justify-content: center;
          margin-top: var(--spacing-md);
        }

        .add-embed-btn-large {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background-color: transparent;
          color: var(--text-secondary);
          border: 1px dashed var(--text-muted);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .add-embed-btn-large:hover {
          border-color: var(--accent);
          color: var(--text-primary);
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