import { useRef, useEffect, useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import type { TextArea, TemplateState } from '@/types/template';
import { useLocalFonts } from '@/hooks/useLocalFonts';

interface CanvasProps {
  state: TemplateState;
  onSelectTextArea: (id: string | null) => void;
  onMoveTextArea: (id: string, x: number, y: number) => void;
  onResizeTextArea: (id: string, x: number, y: number, width: number, height: number) => void;
}

const PLACEHOLDER_TEXTS: Record<string, string> = {
  recipientName: 'Recipient Name',
  message: 'Your message here...',
  senderName: 'From: Sender',
  occasion: 'Happy Birthday!',
};

function getPlaceholderText(id: string): string {
  return PLACEHOLDER_TEXTS[id] || `[${id}]`;
}

export function Canvas({ state, onSelectTextArea, onMoveTextArea, onResizeTextArea }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { loadFont, loadedFonts } = useLocalFonts();
  const [previewTexts, setPreviewTexts] = useState<Record<string, string>>({});

  // Track font families to ensure fonts load when they change
  const fontFamilies = useMemo(() => {
    return state.textAreas.map(area => area.fontFamily).filter(Boolean).join(',');
  }, [state.textAreas]);

  // Load fonts for all text areas
  useEffect(() => {
    state.textAreas.forEach(area => {
      if (area.fontFamily) {
        loadFont(area.fontFamily);
      }
    });
  }, [fontFamilies, state.textAreas, loadFont]);

  // Calculate scale to fit canvas in viewport
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 48;
      const containerHeight = containerRef.current.clientHeight - 48;
      const scaleX = containerWidth / state.canvas.width;
      const scaleY = containerHeight / state.canvas.height;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [state.canvas.width, state.canvas.height]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectTextArea(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 canvas-container flex items-center justify-center p-6 overflow-auto"
      onClick={handleCanvasClick}
    >
      <div
        className="relative bg-muted shadow-xl rounded overflow-hidden"
        style={{
          width: state.canvas.width * scale,
          height: state.canvas.height * scale,
        }}
        onClick={handleCanvasClick}
      >
        {/* Background Image */}
        {state.backgroundImageData ? (
          <img
            src={state.backgroundImageData}
            alt="Template background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No background image</p>
              <p className="text-sm">Upload a PNG image to get started</p>
            </div>
          </div>
        )}

        {/* Text Areas */}
        {state.textAreas.map((area) => (
          <TextAreaBox
            key={area.id}
            area={area}
            scale={scale}
            isSelected={state.selectedTextAreaId === area.id}
            canvasSize={state.canvas}
            loadedFonts={loadedFonts}
            onSelect={() => onSelectTextArea(area.id)}
            onMove={(x, y) => onMoveTextArea(area.id, x, y)}
            onResize={(x, y, w, h) => onResizeTextArea(area.id, x, y, w, h)}
            previewText={previewTexts[area.id]}
            onPreviewTextChange={(text) =>
              setPreviewTexts((prev) => ({
                ...prev,
                [area.id]: text,
              }))
            }
          />
        ))}
      </div>
    </div>
  );
}

interface TextAreaBoxProps {
  area: TextArea;
  scale: number;
  isSelected: boolean;
  canvasSize: { width: number; height: number };
  loadedFonts: Set<string>;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (x: number, y: number, width: number, height: number) => void;
  previewText?: string; // Preview text for double-click editing
  onPreviewTextChange?: (text: string) => void;
}

function TextAreaBox({
  area,
  scale,
  isSelected,
  canvasSize,
  loadedFonts,
  onSelect,
  onMove,
  onResize,
  previewText,
  onPreviewTextChange,
}: TextAreaBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localPreviewText, setLocalPreviewText] = useState(previewText || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert canvas coordinates to scaled display coordinates
  const displayX = area.x * scale;
  const displayY = area.y * scale;
  const displayWidth = area.width * scale;
  const displayHeight = area.height * scale;

  // Determine font size for preview (use average of min/max, scaled)
  const previewFontSize = ((area.maxFontSize + area.minFontSize) / 2) * scale;

  // Handle double-click to start editing
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    const next = previewText || getPlaceholderText(area.id);
    setLocalPreviewText(next);
    onPreviewTextChange?.(next);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  // Handle blur to stop editing
  const handleBlur = () => {
    setIsEditing(false);
    if (onPreviewTextChange) {
      onPreviewTextChange(localPreviewText);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      handleBlur();
    }
  };

  // Display text (preview or placeholder)
  const displayText = isEditing ? localPreviewText : (previewText || getPlaceholderText(area.id));

  const outlineWidth = area.outlineWidth ?? 0;
  const outlineColor = area.outlineColor || '#000000';

  const justifyContent =
    area.textAlign === 'left'
      ? 'flex-start'
      : area.textAlign === 'right'
      ? 'flex-end'
      : 'center';

  return (
    <Rnd
      position={{ x: displayX, y: displayY }}
      size={{ width: displayWidth, height: displayHeight }}
      onDragStart={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDragStop={(_, d) => {
        // Convert back to canvas coordinates
        onMove(d.x / scale, d.y / scale);
      }}
      onResizeStart={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onResizeStop={(_, __, ref, ___, position) => {
        // Convert back to canvas coordinates
        onResize(
          position.x / scale,
          position.y / scale,
          parseFloat(ref.style.width) / scale,
          parseFloat(ref.style.height) / scale
        );
      }}
      bounds="parent"
      minWidth={50 * scale}
      minHeight={30 * scale}
      enableResizing={isSelected}
      resizeHandleStyles={{
        topLeft: { cursor: 'nwse-resize' },
        topRight: { cursor: 'nesw-resize' },
        bottomLeft: { cursor: 'nesw-resize' },
        bottomRight: { cursor: 'nwse-resize' },
      }}
      resizeHandleComponent={{
        topLeft: isSelected ? <ResizeHandle /> : undefined,
        topRight: isSelected ? <ResizeHandle /> : undefined,
        bottomLeft: isSelected ? <ResizeHandle /> : undefined,
        bottomRight: isSelected ? <ResizeHandle /> : undefined,
      }}
      className={`text-area-box ${isSelected ? 'selected' : ''}`}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
        style={{
          transform: area.rotation ? `rotate(${area.rotation}deg)` : undefined,
          transformOrigin: 'center center',
          justifyContent,
          fontFamily: area.fontFamily || 'inherit',
          color: area.fontColor,
          fontSize: `${Math.max(previewFontSize, 10)}px`,
          textAlign: area.textAlign,
          lineHeight: area.lineHeight,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          fontWeight: area.bold ? 'bold' : 'normal',
          fontStyle: area.italic ? 'italic' : 'normal',
          textDecoration: area.underline ? 'underline' : 'none',
          WebkitTextStrokeWidth: outlineWidth ? `${outlineWidth}px` : undefined,
          WebkitTextStrokeColor: outlineWidth ? outlineColor : undefined,
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localPreviewText}
            onChange={(e) => {
              setLocalPreviewText(e.target.value);
              onPreviewTextChange?.(e.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-center"
            style={{
              fontFamily: area.fontFamily || 'inherit',
              color: area.fontColor,
              fontSize: `${Math.max(previewFontSize, 10)}px`,
              textAlign: area.textAlign,
              lineHeight: area.lineHeight,
              fontWeight: area.bold ? 'bold' : 'normal',
              fontStyle: area.italic ? 'italic' : 'normal',
              textDecoration: area.underline ? 'underline' : 'none',
              WebkitTextStrokeWidth: outlineWidth ? `${outlineWidth}px` : undefined,
              WebkitTextStrokeColor: outlineWidth ? outlineColor : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate">{displayText}</span>
        )}
      </div>
    </Rnd>
  );
}

function ResizeHandle() {
  return <div className="resize-handle" />;
}
