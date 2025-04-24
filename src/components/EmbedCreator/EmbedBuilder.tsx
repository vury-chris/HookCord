import React, { useState, useEffect, useRef } from 'react';
import { DiscordEmbed } from './EmbedCreator';

interface EmbedBuilderProps {
  embed: DiscordEmbed | null;
  onChange: (embed: DiscordEmbed) => void;
  onFileUpload: (file: File, fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => void;
  onFileRemove: (fileType: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => void;
}

interface ColorWheelProps {
  value: number | undefined;
  onChange: (color: number) => void;
  onClose: () => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({ value, onChange, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(`#${(value || 5763719).toString(16).padStart(6, '0')}`);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  
  useEffect(() => {
    if (value) {
      const hexColor = `#${value.toString(16).padStart(6, '0')}`;
      setSelectedColor(hexColor);
      
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      
      const hslValues = rgbToHsl(r, g, b);
      setHue(hslValues.h);
      setSaturation(hslValues.s);
      setLightness(hslValues.l);
    }
    
    drawColorWheel();
  }, [value]);
  
  useEffect(() => {
    drawColorWheel();
  }, []);
  
  const drawColorWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 5;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = (angle + 1) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Set color based on angle (hue)
      const hslColor = `hsl(${angle}, 100%, 50%)`;
      ctx.fillStyle = hslColor;
      ctx.fill();
    }
    
    // Draw saturation/lightness selector
    const satLightCanvas = document.createElement('canvas');
    satLightCanvas.width = 200;
    satLightCanvas.height = 200;
    const satLightCtx = satLightCanvas.getContext('2d');
    
    if (satLightCtx) {
      // Saturation gradient (horizontal)
      const satGradient = satLightCtx.createLinearGradient(0, 0, satLightCanvas.width, 0);
      satGradient.addColorStop(0, `hsl(${hue}, 0%, 50%)`);
      satGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
      satLightCtx.fillStyle = satGradient;
      satLightCtx.fillRect(0, 0, satLightCanvas.width, satLightCanvas.height);
      
      // Lightness gradient (vertical)
      const lightGradient = satLightCtx.createLinearGradient(0, 0, 0, satLightCanvas.height);
      lightGradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
      lightGradient.addColorStop(0.5, `rgba(255, 255, 255, 0)`);
      lightGradient.addColorStop(0.5, `rgba(0, 0, 0, 0)`);
      lightGradient.addColorStop(1, `rgba(0, 0, 0, 1)`);
      satLightCtx.fillStyle = lightGradient;
      satLightCtx.fillRect(0, 0, satLightCanvas.width, satLightCanvas.height);
      
      // Add saturation/lightness canvas to main canvas
      ctx.drawImage(satLightCanvas, centerX - radius/2, centerY - radius/2, radius, radius);
    }
    
    // Draw indicator on the wheel if there's a value
    if (value) {
      const angle = hue * Math.PI / 180;
      const distance = radius * 0.75; // Position indicator at 75% of radius
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw saturation/lightness indicator
      const satX = centerX - radius/2 + (saturation / 100) * radius;
      const lightY = centerY - radius/2 + (1 - lightness / 100) * radius;
      
      ctx.beginPath();
      ctx.arc(satX, lightY, 8, 0, Math.PI * 2);
      ctx.strokeStyle = lightness > 50 ? 'black' : 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  
  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;
    
    // Check if click is on the hue wheel
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < radius && distance > radius * 0.5) {
      // Get angle (hue)
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += 2 * Math.PI;
      
      const newHue = Math.round(angle * 180 / Math.PI);
      setHue(newHue);
      
      // Update color based on HSL
      const rgbColor = hslToRgb(newHue, saturation, lightness);
      const hexColor = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
      setSelectedColor(hexColor);
      
      const numColor = parseInt(hexColor.substring(1), 16);
      onChange(numColor);
    } 
    // Check if click is on the saturation/lightness selector
    else if (x >= centerX - radius/2 && x <= centerX + radius/2 && 
             y >= centerY - radius/2 && y <= centerY + radius/2) {
      
      const satX = (x - (centerX - radius/2)) / radius;
      const lightY = (y - (centerY - radius/2)) / radius;
      
      const newSat = Math.min(100, Math.max(0, Math.round(satX * 100)));
      const newLight = Math.min(100, Math.max(0, Math.round((1 - lightY) * 100)));
      
      setSaturation(newSat);
      setLightness(newLight);
      
      // Update color based on HSL
      const rgbColor = hslToRgb(hue, newSat, newLight);
      const hexColor = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
      setSelectedColor(hexColor);
      
      const numColor = parseInt(hexColor.substring(1), 16);
      onChange(numColor);
    }
    
    drawColorWheel();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setSelectedColor(newColor);
    
    // Convert hex to decimal for Discord
    try {
      const numColor = parseInt(newColor.substring(1), 16);
      onChange(numColor);
      
      // Update hue, saturation, lightness
      const r = (numColor >> 16) & 255;
      const g = (numColor >> 8) & 255;
      const b = numColor & 255;
      
      const hslValues = rgbToHsl(r, g, b);
      setHue(hslValues.h);
      setSaturation(hslValues.s);
      setLightness(hslValues.l);
      
      drawColorWheel();
    } catch (error) {
      console.error('Invalid color format', error);
    }
  };
  
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };
  
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };
  
  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  };
  
  const handleClickOutside = (e: MouseEvent) => {
    if (wheelContainerRef.current && !wheelContainerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="color-wheel-container" ref={wheelContainerRef}>
      <div className="color-wheel-header">
        <div className="color-preview" style={{ backgroundColor: selectedColor }}></div>
        <input
          type="text"
          value={selectedColor}
          onChange={handleInputChange}
          className="color-input"
        />
      </div>
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        onClick={handleWheelClick}
      />
      <div className="color-wheel-footer">
        <button onClick={onClose}>Close</button>
      </div>
      
      <style jsx>{`
        .color-wheel-container {
          position: absolute;
          top: -270px;
          left: 0;
          z-index: 100;
          background-color: var(--background-tertiary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .color-wheel-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          width: 100%;
        }
        
        .color-preview {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
        }
        
        .color-input {
          flex-grow: 1;
        }
        
        canvas {
          cursor: pointer;
        }
        
        .color-wheel-footer {
          margin-top: var(--spacing-sm);
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

const emptyField = { name: '', value: '', inline: false };

const EmbedBuilder: React.FC<EmbedBuilderProps> = ({ 
  embed, 
  onChange, 
  onFileUpload, 
  onFileRemove 
}) => {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const authorIconInputRef = useRef<HTMLInputElement>(null);
  const footerIconInputRef = useRef<HTMLInputElement>(null);

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [authorIconPreview, setAuthorIconPreview] = useState<string | null>(null);
  const [footerIconPreview, setFooterIconPreview] = useState<string | null>(null);
  
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showColorWheel, setShowColorWheel] = useState<boolean>(false);
  
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    basic: false,
    author: true,
    images: true,
    footer: true,
    fields: true
  });

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

  const toggleSection = (section: keyof typeof sectionsCollapsed) => {
    setSectionsCollapsed({
      ...sectionsCollapsed,
      [section]: !sectionsCollapsed[section]
    });
  };
  
  const handleChange = (property: string, value: any) => {
    if (!embed) return;
    
    onChange({
      ...embed,
      [property]: value,
    });
  };

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

  const addField = () => {
    if (!embed) return;
    
    const updatedFields = [...(embed.fields || []), { ...emptyField }];
    onChange({
      ...embed,
      fields: updatedFields,
    });
  };

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

  const removeField = (index: number) => {
    if (!embed || !embed.fields) return;
    
    const updatedFields = [...embed.fields];
    updatedFields.splice(index, 1);
    
    onChange({
      ...embed,
      fields: updatedFields,
    });
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'image' | 'author_icon' | 'footer_icon') => {
    if (!embed) return;
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 8 * 1024 * 1024) {
      alert('Image is too large. Maximum size is 8MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    
    const timestamp = new Date().getTime();
    let filename = `${type}_${timestamp}`;
    
    const extension = file.name.split('.').pop() || 'png';
    filename += `.${extension}`;
    
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
    
    const renamedFile = new File([file], filename, { type: file.type });
    onFileUpload(renamedFile, type);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
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
    
    e.target.value = '';
  };

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

    onFileRemove(type);
  };

  const getImagePreviewSrc = (urlFromEmbed: string | undefined, previewFromState: string | null) => {
    if (!urlFromEmbed) return '';
    
    if (urlFromEmbed.startsWith('attachment://')) {
      return previewFromState || '';
    }
    
    return urlFromEmbed;
  };

  if (!embed) return null;

  return (
    <div className="embed-builder">
      <div className="builder-header">
        <h3>Embed Editor</h3>
        <button 
          className="preview-toggle-btn"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
      
      {showPreview && (
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
      )}
      
      <div className="embed-form">
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('basic')}>
            <h4>Basic Information</h4>
            <button className="toggle-btn">
              {sectionsCollapsed.basic ? '+' : '-'}
            </button>
          </div>
          
          {!sectionsCollapsed.basic && (
            <div className="section-content">
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
                <div className="color-selector">
                  <div 
                    className="color-preview" 
                    style={{ backgroundColor: embed.color ? `#${embed.color.toString(16)}` : '#202225' }}
                    onClick={() => setShowColorWheel(true)}
                  ></div>
                  {showColorWheel && (
                    <ColorWheel 
                      value={embed.color}
                      onChange={(color) => handleChange('color', color)}
                      onClose={() => setShowColorWheel(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('author')}>
            <h4>Author</h4>
            <button className="toggle-btn">
              {sectionsCollapsed.author ? '+' : '-'}
            </button>
          </div>
          
          {!sectionsCollapsed.author && (
            <div className="section-content">
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
          )}
        </div>
        
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('images')}>
            <h4>Images</h4>
            <button className="toggle-btn">
              {sectionsCollapsed.images ? '+' : '-'}
            </button>
          </div>
          
          {!sectionsCollapsed.images && (
            <div className="section-content">
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
          )}
        </div>
        
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('footer')}>
            <h4>Footer</h4>
            <button className="toggle-btn">
              {sectionsCollapsed.footer ? '+' : '-'}
            </button>
          </div>
          
          {!sectionsCollapsed.footer && (
            <div className="section-content">
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
          )}
        </div>
        
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('fields')}>
            <div className="fields-header">
              <h4>Fields</h4>
              <span className="field-count">
                {embed.fields?.length || 0}/25
              </span>
            </div>
            <button className="toggle-btn">
              {sectionsCollapsed.fields ? '+' : '-'}
            </button>
          </div>
          
          {!sectionsCollapsed.fields && (
            <div className="section-content">
              <button 
                type="button" 
                className="add-field-btn" 
                onClick={addField}
                disabled={(embed.fields?.length || 0) >= 25}
              >
                + Add Field
              </button>
              
              {embed.fields && embed.fields.length > 0 ? (
                <div className="fields-list">
                  {embed.fields.map((field, index) => (
                    <div key={index} className="field-item">
                      <div className="field-inputs">
                        <input
                          type="text"
                          value={field.name || ''}
                          onChange={(e) => updateField(index, 'name', e.target.value)}
                          placeholder="Field Name"
                          maxLength={256}
                        />
                        <textarea
                          value={field.value || ''}
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
          )}
        </div>
      </div>

      <style jsx>{`
        .embed-builder {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          width: 100%;
        }

        .builder-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .preview-toggle-btn {
          background: var(--button-secondary);
          font-size: 12px;
          padding: var(--spacing-xs) var(--spacing-sm);
        }

        .preview-toggle-btn:hover {
          background: var(--button-secondary-hover);
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
          max-height: 300px;
          overflow-y: auto;
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
          border-radius: var(--radius-md);
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
          gap: var(--spacing-md);
        }

        .form-section {
          background-color: #36393F;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          cursor: pointer;
          background-color: var(--background);
          transition: background-color 0.2s;
        }

        .section-header:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .fields-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .field-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        h4 {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
        }

        .section-content {
          padding: var(--spacing-md);
          border-top: 1px solid var(--background);
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

        .color-selector {
          position: relative;
        }

        .color-preview {
          width: 100%;
          height: 40px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .color-preview:hover {
          transform: scale(1.02);
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

        .add-field-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 12px;
          background-color: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: var(--spacing-md);
        }

        .add-field-btn:hover {
          background-color: var(--button-primary-hover);
        }

        .add-field-btn:disabled {
          background-color: var(--text-muted);
          cursor: not-allowed;
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