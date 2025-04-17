import React, { useRef, useState } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  selectedFiles: File[];
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  value, 
  onChange,
  onFileSelect,
  onFileRemove,
  selectedFiles
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      onFileSelect(fileArray);
      
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileArray = Array.from(e.dataTransfer.files);
      onFileSelect(fileArray);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="message-input">
      <label htmlFor="message-content">Message Content</label>
      
      <div 
        className={`input-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          id="message-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message here... (optional if using embed)"
          rows={4}
        />
        
        <div className="input-actions">
          <button 
            type="button" 
            className="file-button" 
            onClick={handleFileButtonClick}
            title="Add Files"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="file-preview">
              {file.type.startsWith('image/') ? (
                <div className="image-preview">
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                </div>
              ) : (
                <div className="file-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <button 
                type="button" 
                className="remove-file"
                onClick={() => onFileRemove(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .message-input {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        label {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .input-container {
          position: relative;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          transition: border-color 0.2s;
          background-color: var(--input-background);
        }

        .input-container.dragging {
          border-color: var(--accent);
          background-color: rgba(88, 101, 242, 0.05);
        }

        textarea {
          width: 100%;
          min-height: 100px;
          resize: vertical;
          background-color: transparent;
          color: var(--text-primary);
          border: none;
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          padding-right: 40px;
          font-family: inherit;
          font-size: 14px;
        }

        textarea:focus {
          outline: none;
        }

        .input-container:focus-within {
          border-color: var(--input-focus-border);
        }

        .input-actions {
          position: absolute;
          bottom: var(--spacing-sm);
          right: var(--spacing-sm);
          display: flex;
          gap: var(--spacing-xs);
        }

        .file-button {
          background: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          transition: background-color 0.2s, color 0.2s;
          padding: 0;
        }

        .file-button:hover {
          background-color: var(--background-tertiary);
          color: var(--text-secondary);
        }

        .selected-files {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background-color: var(--background-tertiary);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
        }

        .image-preview {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          background-color: var(--background);
          border-radius: var(--radius-sm);
        }

        .file-info {
          flex-grow: 1;
        }

        .file-name {
          font-size: 14px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: var(--text-muted);
        }

        .remove-file {
          background-color: var(--danger);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default MessageInput;