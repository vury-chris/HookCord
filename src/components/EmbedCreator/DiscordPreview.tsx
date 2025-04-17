import React from 'react';
import { DiscordEmbed } from './EmbedCreator';

interface DiscordPreviewProps {
  message: string;
  embeds: DiscordEmbed[];
  selectedEmbedIndices: number[];
  webhookName: string;
  webhookAvatar?: string;
  files: File[];
  embedAttachments: Map<string, File>;
}

const DiscordPreview: React.FC<DiscordPreviewProps> = ({
  message,
  embeds,
  selectedEmbedIndices,
  webhookName,
  webhookAvatar,
  files,
  embedAttachments
}) => {
  const selectedEmbeds = selectedEmbedIndices
    .sort((a, b) => a - b)
    .map(index => embeds[index])
    .filter(embed => 
      embed.title || embed.description || 
      (embed.fields && embed.fields.length > 0) ||
      embed.image || embed.thumbnail ||
      embed.author || embed.footer
    );

  const formatTimestamp = () => {
    const now = new Date();
    return `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getImagePreviewSrc = (urlFromEmbed: string | undefined) => {
    if (!urlFromEmbed) return '';
    
    if (urlFromEmbed.startsWith('attachment://')) {
      const filename = urlFromEmbed.replace('attachment://', '');
      const file = embedAttachments.get(filename);
      if (file) {
        return URL.createObjectURL(file);
      }
      return '';
    }
    
    return urlFromEmbed;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get all attachment filenames used in embeds to avoid duplicates
  const getEmbedAttachmentFilenames = (): Set<string> => {
    const filenames = new Set<string>();
    
    for (const embedIndex of selectedEmbedIndices) {
      const embed = embeds[embedIndex];
      
      if (embed?.thumbnail?.url?.startsWith('attachment://')) {
        filenames.add(embed.thumbnail.url.replace('attachment://', ''));
      }
      
      if (embed?.image?.url?.startsWith('attachment://')) {
        filenames.add(embed.image.url.replace('attachment://', ''));
      }
      
      if (embed?.author?.icon_url?.startsWith('attachment://')) {
        filenames.add(embed.author.icon_url.replace('attachment://', ''));
      }
      
      if (embed?.footer?.icon_url?.startsWith('attachment://')) {
        filenames.add(embed.footer.icon_url.replace('attachment://', ''));
      }
    }
    
    return filenames;
  };

  const renderFilePreview = (file: File) => {
    // Skip files that are used in embeds to avoid duplicates
    const embedFilenames = getEmbedAttachmentFilenames();
    if (embedFilenames.has(file.name)) {
      return null;
    }
    
    if (file.type.startsWith('image/')) {
      return (
        <div className="discord-attachment image-attachment">
          <img src={URL.createObjectURL(file)} alt={file.name} />
        </div>
      );
    } else {
      return (
        <div className="discord-attachment file-attachment">
          <div className="file-icon">
            <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0H4C1.8 0 0 1.8 0 4V36C0 38.2 1.8 40 4 40H26C28.2 40 30 38.2 30 36V10L20 0Z" fill="#4F545C"/>
              <path d="M20 0V10H30L20 0Z" fill="#36393F"/>
            </svg>
          </div>
          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatFileSize(file.size)}</div>
          </div>
        </div>
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="discord-preview-container">
      <div className="discord-preview-header">
        <div className="channel-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.88657 21C5.57547 21 5.3399 20.7189 5.39427 20.4126L6.00001 17H2.59511C2.28449 17 2.04905 16.7198 2.10259 16.4138L2.27759 15.4138C2.31946 15.1746 2.52722 15 2.77011 15H6.35001L7.41001 9H4.00511C3.69449 9 3.45905 8.71977 3.51259 8.41381L3.68759 7.41381C3.72946 7.17456 3.93722 7 4.18011 7H7.76001L8.39677 3.41262C8.43914 3.17391 8.64664 3 8.88907 3H9.87344C10.1845 3 10.4201 3.28107 10.3657 3.58738L9.76001 7H15.76L16.3968 3.41262C16.4391 3.17391 16.6466 3 16.8891 3H17.8734C18.1845 3 18.4201 3.28107 18.3657 3.58738L17.76 7H21.1649C21.4755 7 21.711 7.28023 21.6574 7.58619L21.4824 8.58619C21.4406 8.82544 21.2328 9 20.9899 9H17.41L16.35 15H19.7549C20.0655 15 20.301 15.2802 20.2474 15.5862L20.0724 16.5862C20.0306 16.8254 19.8228 17 19.5799 17H16L15.3632 20.5874C15.3209 20.8261 15.1134 21 14.8709 21H13.8866C13.5755 21 13.3399 20.7189 13.3943 20.4126L14 17H8.00001L7.36325 20.5874C7.32088 20.8261 7.11337 21 6.87094 21H5.88657ZM9.41045 9L8.35045 15H14.3504L15.4104 9H9.41045Z" fill="#8E9297"/>
          </svg>
          <span>webhook-playground</span>
        </div>
      </div>
      
      <div className="discord-messages-container">
        <div className="discord-messages">
          <div className="discord-message">
            <div className="discord-message-avatar">
              {webhookAvatar ? (
                <img src={webhookAvatar} alt={webhookName} />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(webhookName)}
                </div>
              )}
            </div>
            
            <div className="discord-message-content">
              <div className="discord-message-header">
                <span className="discord-author-name">{webhookName}</span>
                <span className="discord-message-timestamp">{formatTimestamp()}</span>
              </div>
              
              {message && (
                <div className="discord-message-text">
                  {message}
                </div>
              )}
              
              {files.length > 0 && (
                <div className="discord-attachments">
                  {files.map((file, index) => (
                    <React.Fragment key={index}>
                      {renderFilePreview(file)}
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              {selectedEmbeds.length > 0 && (
                <div className="discord-embeds">
                  {selectedEmbeds.map((embed, index) => (
                    <div 
                      key={index} 
                      className="discord-embed"
                      style={{ borderLeftColor: embed.color ? `#${embed.color.toString(16)}` : '#202225' }}
                    >
                      {embed.author && (
                        <div className="discord-embed-author">
                          {embed.author.icon_url && (
                            <img 
                              src={getImagePreviewSrc(embed.author.icon_url)} 
                              alt="Author icon" 
                              className="author-icon" 
                            />
                          )}
                          {embed.author.url ? (
                            <a 
                              href={embed.author.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="author-name"
                            >
                              {embed.author.name}
                            </a>
                          ) : (
                            <span className="author-name">{embed.author.name}</span>
                          )}
                        </div>
                      )}
                      
                      {embed.title && (
                        <div className="discord-embed-title">
                          {embed.url ? (
                            <a 
                              href={embed.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {embed.title}
                            </a>
                          ) : (
                            embed.title
                          )}
                        </div>
                      )}
                      
                      {embed.description && (
                        <div className="discord-embed-description">
                          {embed.description}
                        </div>
                      )}
                      
                      {embed.fields && embed.fields.length > 0 && (
                        <div className="discord-embed-fields">
                          {embed.fields.map((field, fieldIndex) => (
                            <div 
                              key={fieldIndex} 
                              className={`discord-embed-field ${field.inline ? 'inline' : ''}`}
                            >
                              {field.name && (
                                <div className="discord-field-name">{field.name}</div>
                              )}
                              {field.value && (
                                <div className="discord-field-value">{field.value}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="discord-embed-media">
                        {embed.thumbnail && (
                          <div className="discord-embed-thumbnail">
                            <img 
                              src={getImagePreviewSrc(embed.thumbnail.url)} 
                              alt="Thumbnail" 
                            />
                          </div>
                        )}
                        
                        {embed.image && (
                          <div className="discord-embed-image">
                            <img 
                              src={getImagePreviewSrc(embed.image.url)} 
                              alt="Embed image" 
                            />
                          </div>
                        )}
                      </div>
                      
                      {embed.footer && (
                        <div className="discord-embed-footer">
                          {embed.footer.icon_url && (
                            <img 
                              src={getImagePreviewSrc(embed.footer.icon_url)} 
                              alt="Footer icon" 
                              className="footer-icon" 
                            />
                          )}
                          <span>{embed.footer.text}</span>
                          {embed.timestamp && (
                            <>
                              <span className="footer-separator">•</span>
                              <span>{new Date(embed.timestamp).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="discord-input-container">
        <div className="discord-input">
          <input type="text" placeholder="Message #webhook-playground" disabled />
        </div>
      </div>

      <style jsx>{`
        .discord-preview-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: #36393F;
          border-radius: 8px;
          overflow: hidden;
          font-family: 'Open Sans', Whitney, 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        .discord-preview-header {
          height: 48px;
          background-color: #2F3136;
          border-bottom: 1px solid #202225;
          display: flex;
          align-items: center;
          padding: 0 16px;
          flex-shrink: 0;
        }
        
        .channel-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FFFFFF;
          font-weight: 600;
        }
        
        .discord-messages-container {
          flex-grow: 1;
          overflow-y: auto;
          padding: 16px 0;
          display: flex;
          flex-direction: column-reverse;
        }
        
        .discord-messages {
          padding: 0 16px;
        }
        
        .discord-message {
          display: flex;
          margin-bottom: 16px;
          padding-top: 8px;
        }
        
        .discord-message-avatar {
          margin-right: 16px;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }
        
        .discord-message-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #5865F2;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 600;
        }
        
        .discord-message-content {
          flex-grow: 1;
          min-width: 0;
        }
        
        .discord-message-header {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .discord-author-name {
          color: #FFFFFF;
          font-weight: 600;
          margin-right: 8px;
        }
        
        .discord-message-timestamp {
          color: #72767D;
          font-size: 12px;
        }
        
        .discord-message-text {
          color: #DCDDDE;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin-bottom: 8px;
        }
        
        .discord-attachments {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
        }
        
        .discord-attachment {
          max-width: 520px;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .image-attachment img {
          max-width: 100%;
          max-height: 350px;
          object-fit: contain;
        }
        
        .file-attachment {
          display: flex;
          background-color: #2F3136;
          padding: 10px;
          border-radius: 3px;
          align-items: center;
        }
        
        .file-icon {
          margin-right: 10px;
          flex-shrink: 0;
        }
        
        .file-details {
          overflow: hidden;
        }
        
        .file-name {
          color: #00AFF4;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .file-size {
          color: #72767D;
          font-size: 12px;
        }
        
        .discord-embeds {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        
        .discord-embed {
          background-color: #2F3136;
          border-left: 4px solid;
          border-radius: 4px;
          padding: 8px 16px 16px 12px;
          max-width: 520px;
        }
        
        .discord-embed-author {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .author-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
          object-fit: cover;
        }
        
        .author-name {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }
        
        .discord-embed-title {
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .discord-embed-title a {
          color: #00AFF4;
          text-decoration: none;
        }
        
        .discord-embed-title a:hover {
          text-decoration: underline;
        }
        
        .discord-embed-description {
          color: #DCDDDE;
          font-size: 14px;
          margin-bottom: 8px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .discord-embed-fields {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 8px;
          margin-top: 8px;
        }
        
        .discord-embed-field {
          margin-bottom: 8px;
          flex-basis: 100%;
        }
        
        .discord-embed-field.inline {
          flex-basis: calc(50% - 8px);
          margin-right: 8px;
        }
        
        .discord-field-name {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .discord-field-value {
          color: #DCDDDE;
          font-size: 14px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .discord-embed-media {
          position: relative;
        }
        
        .discord-embed-thumbnail {
          float: right;
          margin-left: 16px;
          margin-bottom: 16px;
          width: 80px;
          height: 80px;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .discord-embed-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .discord-embed-image {
          max-width: 100%;
          margin-top: 16px;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .discord-embed-image img {
          max-width: 100%;
          max-height: 300px;
        }
        
        .discord-embed-footer {
          display: flex;
          align-items: center;
          margin-top: 8px;
          font-size: 12px;
          color: #72767D;
        }
        
        .footer-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 8px;
          object-fit: cover;
        }
        
        .footer-separator {
          margin: 0 4px;
        }
        
        .discord-input-container {
          padding: 0 16px 24px;
          flex-shrink: 0;
        }
        
        .discord-input {
          background-color: #40444B;
          border-radius: 8px;
          padding: 11px 16px;
        }
        
        .discord-input input {
          width: 100%;
          background: transparent;
          border: none;
          color: #DCDDDE;
          font-family: inherit;
          font-size: 16px;
          outline: none;
        }
        
        .discord-input input::placeholder {
          color: #72767D;
        }
      `}</style>
    </div>
  );
};

export default DiscordPreview;