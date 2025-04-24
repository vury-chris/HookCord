import React, { useState, useRef, useEffect } from 'react';
import { Webhook } from '../../App';

interface WebhookFormProps {
  webhook?: Webhook;
  onSave: (url: string, name: string, avatarUrl?: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  isEditing?: boolean;
}

const WebhookForm: React.FC<WebhookFormProps> = ({ 
  webhook,
  onSave, 
  onCancel,
  isLoading,
  isEditing = false
}) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [urlError, setUrlError] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<'upload' | 'url'>('upload');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (webhook && isEditing) {
      setUrl(webhook.url);
      setName(webhook.name);
      
      if (webhook.avatarUrl) {
        if (webhook.avatarUrl.startsWith('http')) {
          setAvatarType('url');
          setAvatarUrlInput(webhook.avatarUrl);
          setAvatar(webhook.avatarUrl);
        } else {
          setAvatarType('upload');
          setAvatar(webhook.avatarUrl);
        }
      }
    }
  }, [webhook, isEditing]);

  const validateUrl = (input: string) => {
    const discordWebhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
    return discordWebhookRegex.test(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing && !validateUrl(url)) {
      setUrlError('Please enter a valid Discord webhook URL');
      return;
    }
    
    const webhookName = name.trim() || 'Unnamed Webhook';
    
    let finalAvatarUrl = undefined;
    if (avatarType === 'url' && avatarUrlInput) {
      finalAvatarUrl = avatarUrlInput;
    } else if (avatarType === 'upload' && avatar) {
      finalAvatarUrl = avatar;
    }
    
    onSave(url, webhookName, finalAvatarUrl);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      alert('Image is too large. Maximum size is 1MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
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
    setAvatarUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="webhook-form-container">
      <div className="webhook-form">
        <h2>{isEditing ? 'Edit Webhook' : 'Add New Webhook'}</h2>
        
        <form onSubmit={handleSubmit}>
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
              disabled={isEditing}
            />
            {urlError && <div className="input-error">{urlError}</div>}
            {isEditing && (
              <div className="form-help">
                Webhook URL cannot be changed
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="webhook-name">Webhook Name</label>
            <input
              id="webhook-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Discord Webhook"
            />
            <div className="form-help">
              This name will override the webhook's original name when sending messages
            </div>
          </div>
          
          <div className="form-group">
            <label>Webhook Avatar</label>
            
            <div className="avatar-type-selector">
              <label className={`avatar-type-option ${avatarType === 'upload' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="avatarType"
                  value="upload"
                  checked={avatarType === 'upload'}
                  onChange={() => setAvatarType('upload')}
                />
                Upload Image
              </label>
              
              <label className={`avatar-type-option ${avatarType === 'url' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="avatarType"
                  value="url"
                  checked={avatarType === 'url'}
                  onChange={() => setAvatarType('url')}
                />
                Image URL
              </label>
            </div>
            
            {avatarType === 'upload' ? (
              <div className="avatar-upload" onClick={handleAvatarClick}>
                {avatar && avatarType === 'upload' ? (
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
                <div className="form-help">
                  Uploaded avatars will only appear in the app, not in Discord messages.
                  To use a custom avatar in Discord, use an image URL instead.
                </div>
              </div>
            ) : (
              <div className="url-input-container">
                <input
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e) => {
                    setAvatarUrlInput(e.target.value);
                    setAvatar(e.target.value);
                  }}
                  placeholder="https://example.com/image.png"
                />
                <div className="form-help">
                  Image URL must be publicly accessible. This will appear in Discord messages.
                </div>
                {avatarUrlInput && (
                  <div className="avatar-preview-url">
                    <img src={avatarUrlInput} alt="Preview" onError={() => {
                      setAvatar(null);
                    }} />
                  </div>
                )}
              </div>
            )}
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
              disabled={isLoading || (!isEditing && !url.trim())}
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Webhook' : 'Create Webhook')}
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
          margin-bottom: var(--spacing-sm);
          cursor: pointer;
          flex-direction: column;
          align-items: center;
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
          margin-bottom: var(--spacing-sm);
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
          margin-bottom: var(--spacing-sm);
        }

        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .avatar-preview-url {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          overflow: hidden;
          margin-top: var(--spacing-sm);
        }
        
        .avatar-preview-url img {
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

        input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-error {
          color: var(--danger);
          font-size: 12px;
          margin-top: var(--spacing-xs);
        }

        .form-help {
          color: var(--text-muted);
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
        
        .avatar-type-selector {
          display: flex;
          margin-bottom: var(--spacing-md);
          gap: var(--spacing-md);
        }
        
        .avatar-type-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .avatar-type-option:hover {
          background-color: var(--background-tertiary);
        }
        
        .avatar-type-option.selected {
          background-color: var(--accent);
          color: white;
        }
        
        .avatar-type-option input {
          margin: 0;
          width: auto;
        }
        
        .url-input-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default WebhookForm;