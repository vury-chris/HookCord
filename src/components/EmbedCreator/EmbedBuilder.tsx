import React, { useState, useEffect, useRef } from 'react';
import { DiscordEmbed } from './EmbedCreator';

interface EmbedBuilderProps {
  embed: DiscordEmbed | null;
  onChange: (embed: DiscordEmbed) => void;
  onFileUpload: (file: File, fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => void;
  onFileRemove: (fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => void;
}

// Available colors for the embed
const colorOptions = [
  { name: 'Default', value: null },
  { name: 'Blue', value: 3447003 },
  { name: 'Green', value: 5763719 },
  { name: 'Red', value: 15548997 },
  { name: 'Orange', value: 15105570 },
  { name: 'Yellow', value: 16776960 },
  { name: 'Purple', value: 10181046 },
  { name: 'Pink', value: 15277667 },
  { name: 'Cyan', value: 1752220 },
];

// Default empty field
const emptyField = { name: '', value: '', inline: false };

const EmbedBuilder: React.FC<EmbedBuilderProps> = ({ embed, onChange, onFileUpload, onFileRemove }) => {
  // File input references
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const authorIconInputRef = useRef<HTMLInputElement>(null);
  const footerIconInputRef = useRef<HTMLInputElement>(null);

  // State for image previews
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [authorIconPreview, setAuthorIconPreview] = useState<string | null>(null);
  const [footerIconPreview, setFooterIconPreview] = useState<string | null>(null);

  // Initialize embed with default values if null
  useEffect(() => {
    if (!embed) {
      onChange({
        title: '',
        description: '',
        color: undefined,
        fields: [],
      });
    }
  }, [embed, onChange]);

  // Handle changes for basic properties
  const handleChange = (property: string, value: any) => {
    if (!embed) return;
    
    onChange({
      ...embed,
      [property]: value,
    });
  };

  // Handle nested object changes (footer, author)
  const handleNestedChange = (parent: string, property: string, value: any) => {
    if (!embed) return;
    
    const parentObj = embed[parent] || {};
    
    onChange({
      ...embed,
      [parent]: {
        ...parentObj,
        [property]: value
      }
    });
  };

  // Handle adding a new field
  const addField = () => {
    if (!embed) return;
    
    const updatedFields = [...(embed.fields || []), { ...emptyField }];
    onChange({
      ...embed,
      fields: updatedFields,
    });
  };

  // Handle field updates
  const updateField = (index: number, property: string, value: any) => {
    if (!embed || !embed.fields) return;
    
    const updatedFields = [...embed.fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [property]: value,
    };
    
    onChange({
      ...embed,
      fields: updatedFields,
    });
  };

  // Handle field removal
  const removeField = (index: number) => {
    if (!embed || !embed.fields) return;
    
    const updatedFields = [...embed.fields];
    updatedFields.splice(index, 1);
    
    onChange({
      ...embed,
      fields: updatedFields,
    });
  };

  // Handle file selection for different image types
  const handleFileSelect = (type: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    if (!embed) return;
    
    const fileInput = {
      thumbnail: thumbnailInputRef,
      image: imageInputRef,
      author_icon: authorIconInputRef,
      footer_icon: footerIconInputRef
    }[type];
    
    fileInput.current?.click();
  };

  // Handle file change after selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    if (!embed) return;
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 8MB for Discord embeds)
    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large. Maximum size is 8MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    // Generate a unique filename for the attachment
    const timestamp = new Date().getTime();
    let filename = `${type}_${timestamp}`;
    
    // Add the appropriate extension
    const extension = file.name.split('.').pop() || 'png';
    filename += `.${extension}`;
    
    // Update the embed to use attachment:// URL
    switch (type) {
      case 'thumbnail':
        handleChange('thumbnail', { url: `attachment://${filename}` });
        break;
      case 'image':
        handleChange('image', { url: `attachment://${filename}` });
        break;
      case 'author_icon':
        handleNestedChange('author', 'icon_url', `attachment://${filename}`);
        break;
      case 'footer_icon':
        handleNestedChange('footer', 'icon_url', `attachment://${filename}`);
        break;
    }
    
    // Send the file to the parent component for upload handling
    // Create a new File object with the new filename
    const renamedFile = new File([file], filename, { type: file.type });
    onFileUpload(renamedFile, type);
    
    // Also create a preview using URL.createObjectURL for the UI
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Store the preview in state
        switch (type) {
          case 'thumbnail':
            setThumbnailPreview(result);
            break;
          case 'image':
            setImagePreview(result);
            break;
          case 'author_icon':
            setAuthorIconPreview(result);
            break;
          case 'footer_icon':
            setFooterIconPreview(result);
            break;
        }
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  // Remove an image
  const removeImage = (type: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    if (!embed) return;
    
    switch (type) {
      case 'thumbnail':
        handleChange('thumbnail', undefined);
        setThumbnailPreview(null);
        break;
      case 'image':
        handleChange('image', undefined);
        setImagePreview(null);
        break;
      case 'author_icon':
        if (embed.author) {
          const { icon_url, ...rest } = embed.author;
          handleChange('author', rest);
        }
        setAuthorIconPreview(null);
        break;
      case 'footer_icon':
        if (embed.footer) {
          const { icon_url, ...rest } = embed.footer;
          handleChange('footer', rest);
        }
        setFooterIconPreview(null);
        break;
    }

    // Notify parent to remove the file from the files array
    onFileRemove(type);
  };

  // Skip rendering if embed is not initialized yet
  if (!embed) return null;

  // Helper function to determine image source
  const getImagePreviewSrc = (urlFromEmbed: string | undefined, previewFromState: string | null) => {
    if (!urlFromEmbed) return '';
    
    // If it's an attachment URL, use the preview from state
    if (urlFromEmbed.startsWith('attachment://')) {
      return previewFromState || '';
    }
    
    // Otherwise use the URL directly
    return urlFromEmbed;
  };

  return (
    <div className="embed-builder">
      <h3>Embed Builder</h3>
      
      <div className="embed-preview" style={{ borderLeftColor: embed.color ? `#${embed.color.toString(16)}` : '#202225' }}>
        {embed.author && (
          <div className="embed-author">
            {embed.author.icon_url && (
              <img 
                src={getImagePreviewSrc(embed.author.icon_url, authorIconPreview)} 
                alt="Author icon" 
                className="author-icon" 
              />
            )}
            <div className="author-name">{embed.author.name}</div>
          </div>
        )}
        
        {embed.title && <div className="embed-title">{embed.title}</div>}
        {embed.description && <div className="embed-description">{embed.description}</div>}
        
        {embed.thumbnail && (
          <div className="embed-thumbnail">
            <img 
              src={getImagePreviewSrc(embed.thumbnail.url, thumbnailPreview)} 
              alt="Thumbnail" 
            />
          </div>
        )}
        
        {embed.fields && embed.fields.length > 0 && (
          <div className="embed-fields">
            {embed.fields.map((field, index) => (
              <div key={index} className={`embed-field ${field.inline ? 'inline' : ''}`}>
                {field.name && <div className="field-name">{field.name}</div>}
                {field.value && <div className="field-value">{field.value}</div>}
              </div>
            ))}
          </div>
        )}
        
        {embed.image && (
          <div className="embed-image">
            <img 
              src={getImagePreviewSrc(embed.image.url, imagePreview)} 
              alt="Embed image" 
            />
          </div>
        )}
        
        {embed.footer && (
          <div className="embed-footer">
            {embed.footer.icon_url && (
              <img 
                src={getImagePreviewSrc(embed.footer.icon_url, footerIconPreview)} 
                alt="Footer icon" 
                className="footer-icon" 
              />
            )}
            <div className="footer-text">{embed.footer.text}</div>
          </div>
        )}
      </div>
      
      <div className="embed-form">
        <div className="form-section">
          <h4>Basic Information</h4>
          
          <div className="form-group">
            <label htmlFor="embed-title">Title</label>
            <input
              id="embed-title"
              type="text"
              value={embed.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Embed Title"
              maxLength={256}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="embed-description">Description</label>
            <textarea
              id="embed-description"
              value={embed.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Embed Description"
              rows={3}
              maxLength={4096}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="embed-color">Color</label>
            <select
              id="embed-color"
              value={embed.color || ''}
              onChange={(e) => handleChange('color', e.target.value ? parseInt(e.target.value) : undefined)}
            >
              {colorOptions.map((color) => (
                <option key={color.name} value={color.value || ''}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Author</h4>
          
          <div className="form-group">
            <label htmlFor="embed-author-name">Author Name</label>
            <input
              id="embed-author-name"
              type="text"
              value={(embed.author && embed.author.name) || ''}
              onChange={(e) => handleNestedChange('author', 'name', e.target.value)}
              placeholder="Author Name"
              maxLength={256}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="embed-author-url">Author URL (Optional)</label>
            <input
              id="embed-author-url"
              type="text"
              value={(embed.author && embed.author.url) || ''}
              onChange={(e) => handleNestedChange('author', 'url', e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Author Icon</label>
            <div className="image-upload">
              {embed.author && embed.author.icon_url ? (
                <div className="image-preview">
                  <img 
                    src={getImagePreviewSrc(embed.author.icon_url, authorIconPreview)} 
                    alt="Author icon" 
                  />
                  <button 
                    type="button" 
                    className="remove-image" 
                    onClick={() => removeImage('author_icon')}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="upload-button"
                  onClick={() => handleFileSelect('author_icon')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload Icon
                </button>
              )}
              <input 
                type="file" 
                ref={authorIconInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'author_icon')}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Images</h4>
          
          <div className="images-row">
            <div className="form-group image-column">
              <label>Thumbnail (Right)</label>
              <div className="image-upload">
                {embed.thumbnail ? (
                  <div className="image-preview">
                    <img 
                      src={getImagePreviewSrc(embed.thumbnail.url, thumbnailPreview)} 
                      alt="Thumbnail" 
                    />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => removeImage('thumbnail')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="upload-button"
                    onClick={() => handleFileSelect('thumbnail')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Upload Thumbnail
                  </button>
                )}
                <input 
                  type="file" 
                  ref={thumbnailInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                />
              </div>
            </div>
            
            <div className="form-group image-column">
              <label>Main Image</label>
              <div className="image-upload">
                {embed.image ? (
                  <div className="image-preview">
                    <img 
                      src={getImagePreviewSrc(embed.image.url, imagePreview)} 
                      alt="Main image" 
                    />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => removeImage('image')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    className="upload-button"
                    onClick={() => handleFileSelect('image')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Upload Image
                  </button>
                )}
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'image')}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4>Footer</h4>
          
          <div className="form-group">
            <label htmlFor="embed-footer-text">Footer Text</label>
            <input
              id="embed-footer-text"
              type="text"
              value={(embed.footer && embed.footer.text) || ''}
              onChange={(e) => handleNestedChange('footer', 'text', e.target.value)}
              placeholder="Footer Text"
              maxLength={2048}
            />
          </div>
          
          <div className="form-group">
            <label>Footer Icon</label>
            <div className="image-upload">
              {embed.footer && embed.footer.icon_url ? (
                <div className="image-preview">
                  <img 
                    src={getImagePreviewSrc(embed.footer.icon_url, footerIconPreview)} 
                    alt="Footer icon" 
                  />
                  <button 
                    type="button" 
                    className="remove-image" 
                    onClick={() => removeImage('footer_icon')}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="upload-button"
                  onClick={() => handleFileSelect('footer_icon')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload Icon
                </button>
              )}
              <input 
                type="file" 
                ref={footerIconInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'footer_icon')}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <div className="fields-header">
            <h4>Fields</h4>
            <button 
              type="button" 
              className="add-field-btn" 
              onClick={addField}
              disabled={(embed.fields?.length || 0) >= 25}
            >
              + Add Field
            </button>
          </div>
          
          {embed.fields && embed.fields.length > 0 ? (
            <div className="fields-list">
              {embed.fields.map((field, index) => (
                <div key={index} className="field-item">
                  <div className="field-inputs">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(index, 'name', e.target.value)}
                      placeholder="Field Name"
                      maxLength={256}
                    />
                    <textarea
                      value={field.value}
                      onChange={(e) => updateField(index, 'value', e.target.value)}
                      placeholder="Field Value"
                      rows={2}
                      maxLength={1024}
                    />
                    <label className="inline-checkbox">
                      <input
                        type="checkbox"
                        checked={field.inline || false}
                        onChange={(e) => updateField(index, 'inline', e.target.checked)}
                      />
                      Inline
                    </label>
                  </div>
                  <button 
                    type="button" 
                    className="remove-field-btn"
                    onClick={() => removeField(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-fields">
              No fields added yet. Fields let you organize information in columns.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .embed-builder {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        h3, h4 {
          margin: 0;
          margin-bottom: var(--spacing-sm);
          color: var(--text-primary);
        }

        h4 {
          color: var(--text-secondary);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .embed-preview {
          background-color: var(--background-tertiary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          border-left: 4px solid #202225;
          margin-bottom: var(--spacing-md);
        }

        .embed-author {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .author-icon, .footer-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }

        .author-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .embed-title {
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
        }

        .embed-description {
          margin-bottom: var(--spacing-md);
          white-space: pre-wrap;
        }

        .embed-thumbnail {
          float: right;
          margin-left: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          width: 80px;
          height: 80px;
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .embed-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .embed-image {
          margin-top: var(--spacing-md);
          max-width: 100%;
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .embed-image img {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
        }

        .embed-fields {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
        }

        .embed-field {
          flex: 0 0 100%;
        }

        .embed-field.inline {
          flex: 0 0 calc(50% - var(--spacing-md) / 2);
        }

        .field-name {
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .field-value {
          white-space: pre-wrap;
        }

        .embed-footer {
          margin-top: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 12px;
          color: var(--text-muted);
        }

        .embed-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .form-section {
          background-color: var(--background-tertiary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .images-row {
          display: flex;
          gap: var(--spacing-md);
        }

        .image-column {
          flex: 1;
        }

        label {
          font-size: 14px;
          color: var(--text-secondary);
        }

        input, textarea, select {
          width: 100%;
          background-color: var(--input-background);
          color: var(--text-primary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm);
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus, textarea:focus, select:focus {
          border-color: var(--input-focus-border);
          outline: none;
        }

        textarea {
          resize: vertical;
        }

        .image-upload {
          display: flex;
          flex-direction: column;
        }

        .upload-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          height: 80px;
          background-color: var(--background);
          border: 1px dashed var(--text-muted);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color 0.2s, border-color 0.2s;
        }

        .upload-button:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-color: var(--text-secondary);
        }

        .image-preview {
          position: relative;
          height: 80px;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: var(--spacing-xs);
          right: var(--spacing-xs);
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

        .image-preview:hover .remove-image {
          opacity: 1;
        }

        .fields-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .add-field-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 12px;
        }

        .fields-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .field-item {
          display: flex;
          gap: var(--spacing-sm);
          background-color: var(--background);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
        }

        .field-inputs {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .inline-checkbox {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .inline-checkbox input {
          width: auto;
        }

        .remove-field-btn {
          background-color: var(--danger);
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 16px;
          align-self: flex-start;
        }

        .no-fields {
          color: var(--text-muted);
          font-size: 14px;
          background-color: var(--background);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          text-align: center;
        }
      `}</style>
      </div>
    );
  };
  export default EmbedBuilder;