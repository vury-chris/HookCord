import React from 'react';

interface EmptyLibraryProps {
  onAddClick: () => void;
}

const EmptyLibrary: React.FC<EmptyLibraryProps> = ({ onAddClick }) => {
  return (
    <div className="empty-library">
      <div className="empty-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z" fill="#72767D"/>
        </svg>
        <h2>No Webhooks Yet</h2>
        <p>Add your first Discord webhook to get started</p>
        <button onClick={onAddClick}>+ Add Webhook</button>
      </div>

      <style jsx>{`
        .empty-library {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          text-align: center;
          max-width: 400px;
          padding: var(--spacing-xl);
          background-color: var(--background-secondary);
          border-radius: var(--radius-lg);
        }

        h2 {
          color: var(--text-primary);
          margin: 0;
        }

        p {
          color: var(--text-secondary);
          margin: 0;
          margin-bottom: var(--spacing-md);
        }

        button {
          margin-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
};

export default EmptyLibrary;