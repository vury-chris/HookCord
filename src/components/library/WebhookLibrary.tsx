import React, { useState } from 'react';
import { Webhook } from '../../App';
import EmptyLibrary from './EmptyLibrary';
import WebhookForm from './WebhookForm';

interface WebhookLibraryProps {
  webhooks: Webhook[];
  onSelect: (webhook: Webhook) => void;
  onSave: (url: string, name: string, avatarUrl?: string) => Promise<Webhook>;
  onDelete: (webhookId: string) => Promise<void>;
}

const WebhookLibrary: React.FC<WebhookLibraryProps> = ({ 
  webhooks, 
  onSelect, 
  onSave,
  onDelete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Extract server and channel info from webhook URL
  const extractWebhookInfo = (url: string) => {
    try {
      // Discord webhook URL format: https://discord.com/api/webhooks/{server_id}/{token}
      const parts = url.split('/');
      if (parts.length >= 7) {
        // We can extract the webhook ID
        const webhookId = parts[5];
        
        // For display purposes, we'll show a shortened version of the ID
        const shortId = webhookId.substring(0, 7) + '...';
        
        return {
          webhookId,
          displayId: shortId
        };
      }
    } catch (error) {
      console.error('Error extracting webhook info:', error);
    }
    
    return { 
      webhookId: null,
      displayId: "Unknown ID"
    };
  };

  // Handle form submission
  const handleSaveWebhook = async (url: string, name: string, avatarUrl?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onSave(url, name, avatarUrl);
      setShowForm(false);
    } catch (err) {
      setError('Failed to save webhook. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle webhook deletion
  const handleDeleteWebhook = async (webhookId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the card click (select)
    
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      setIsDeleting(webhookId);
      try {
        await onDelete(webhookId);
      } catch (error) {
        console.error('Failed to delete webhook:', error);
        setError('Failed to delete webhook. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Get initials for avatar placeholder
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate a color based on webhook name
  const getColorFromName = (name: string): string => {
    const colors = [
      '#5865F2', // Discord blue
      '#EB459E', // Pink
      '#ED4245', // Red
      '#FEE75C', // Yellow
      '#57F287', // Green
      '#9B59B6', // Purple
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="webhook-library">
      <div className="library-header">
        <h1>Webhook Library</h1>
        <button onClick={() => setShowForm(true)}>
          + Add Webhook
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm ? (
        <WebhookForm 
          onSave={handleSaveWebhook} 
          onCancel={() => setShowForm(false)}
          isLoading={isLoading}
        />
      ) : webhooks.length === 0 ? (
        <EmptyLibrary onAddClick={() => setShowForm(true)} />
      ) : (
        <div className="webhooks-grid">
          {webhooks.map((webhook) => (
            <div 
              key={webhook.id} 
              className="webhook-card"
              onClick={() => onSelect(webhook)}
            >
              <button 
                className="delete-webhook-btn"
                onClick={(e) => handleDeleteWebhook(webhook.id, e)}
                disabled={isDeleting === webhook.id}
              >
                {isDeleting === webhook.id ? '...' : '×'}
              </button>
                
              <div className="webhook-avatar">
                {webhook.avatarUrl ? (
                  <img src={webhook.avatarUrl} alt={webhook.name} />
                ) : (
                  <div 
                    className="webhook-avatar-placeholder" 
                    style={{ backgroundColor: getColorFromName(webhook.name) }}
                  >
                    {getInitials(webhook.name)}
                  </div>
                )}
              </div>
              <div className="webhook-info">
                <div className="webhook-name">{webhook.name}</div>
                <div className="webhook-meta">
                  <div>ID: {extractWebhookInfo(webhook.url).displayId}</div>
                  <div>Last used: {formatDate(webhook.lastUsed)}</div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add webhook card */}
          <div 
            className="webhook-card add-webhook"
            onClick={() => setShowForm(true)}
          >
            <div className="add-webhook-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="add-webhook-text">Add Webhook</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .webhook-library {
          padding: var(--spacing-lg);
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          position: sticky;
          top: 0;
          background-color: var(--background);
          z-index: 10;
          padding-bottom: var(--spacing-md);
        }

        .error-message {
          background-color: var(--danger);
          color: white;
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
        }

        .webhooks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-md);
          padding-bottom: var(--spacing-xl);
        }

        .webhook-card {
          background-color: var(--background-secondary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          cursor: pointer;
          transition: transform 0.2s, background-color 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          height: 250px;
          position: relative;
        }

        .webhook-card:hover {
          background-color: var(--background-tertiary);
          transform: translateY(-2px);
        }

        .webhook-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin-bottom: var(--spacing-md);
          overflow: hidden;
        }

        .webhook-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .webhook-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
        }

        .webhook-info {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .webhook-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: var(--spacing-xs);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .webhook-meta {
          color: var(--text-muted);
          font-size: 12px;
          margin-bottom: var(--spacing-md);
          text-align: center;
        }

        .delete-webhook-btn {
          position: absolute;
          top: var(--spacing-xs);
          right: var(--spacing-xs);
          background-color: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 16px;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 2;
        }

        .webhook-card:hover .delete-webhook-btn {
          opacity: 1;
        }

        .delete-webhook-btn:hover {
          background-color: var(--danger);
          opacity: 1;
        }

        .delete-webhook-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .add-webhook {
          border: 2px dashed var(--text-muted);
          background-color: transparent;
          justify-content: center;
        }

        .add-webhook:hover {
          border-color: var(--text-secondary);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .add-webhook-icon {
          margin-bottom: var(--spacing-md);
          color: var(--text-muted);
        }

        .add-webhook-text {
          color: var(--text-secondary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default WebhookLibrary;