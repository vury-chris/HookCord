import React, { useState, useRef } from 'react';

interface WebhookFormProps {
  onSave: (url: string, name: string, avatarUrl?: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const WebhookForm: React.FC<WebhookFormProps> = ({ 
  onSave, 
  onCancel,
  isLoading 
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [urlError, setUrlError] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (input: string) => {
    // Simple Discord webhook URL validation
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return discordWebhookRegex.test(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL
    if (!validateUrl(url)) {
      setUrlError('Please enter a valid Discord webhook URL');
      return;
    }
    
    // Use default name if not provided
    const webhookName = name.trim() || 'Unnamed Webhook';
    
    // Save webhook
    onSave(url, webhookName, avatar || undefined);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert('Image is too large. Maximum size is 1MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    // Convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="webhook-form-container">
      <div className="webhook-form">
        <h2>Add New Webhook</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="avatar-upload" onClick={handleAvatarClick}>
            {avatar ? (
              <div className="avatar-preview">
                <img src={avatar} alt="Webhook avatar" />
                <button 
                  type="button" 
                  className="remove-avatar" 
                  onClick={removeAvatar}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="avatar-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Add Avatar</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="webhook-url">Discord Webhook URL</label>
            <input
              id="webhook-url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
              placeholder="https://discord.com/api/webhooks/..."
              required
            />
            {urlError && <div className="input-error">{urlError}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="webhook-name">Webhook Name (Optional)</label>
            <input
              id="webhook-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Discord Webhook"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="secondary" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .webhook-form-container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: var(--spacing-xl);
        }

        .webhook-form {
          background-color: var(--background-secondary);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          width: 100%;
          max-width: 500px;
        }

        h2 {
          margin-bottom: var(--spacing-lg);
          color: var(--text-primary);
        }

        .avatar-upload {
          display: flex;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
          cursor: pointer;
        }

        .avatar-placeholder {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background-color: var(--background-tertiary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          transition: background-color 0.2s;
        }

        .avatar-placeholder:hover {
          background-color: var(--background);
        }

        .avatar-placeholder span {
          font-size: 12px;
          margin-top: var(--spacing-xs);
        }

        .avatar-preview {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
        }

        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-avatar {
          position: absolute;
          top: 0;
          right: 0;
          width: 24px;
          height: 24px;
          background-color: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .avatar-preview:hover .remove-avatar {
          opacity: 1;
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        label {
          display: block;
          margin-bottom: var(--spacing-xs);
          color: var(--text-secondary);
          font-size: 14px;
        }

        input {
          width: 100%;
          margin-bottom: var(--spacing-xs);
        }

        .input-error {
          color: var(--danger);
          font-size: 12px;
          margin-top: var(--spacing-xs);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default WebhookForm;