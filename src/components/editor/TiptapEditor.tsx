import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Node as TipTapNode } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useCallback, useRef, useEffect } from 'react';
import './TiptapEditor.css';

// Extensión personalizada para el bloque de contador
const CounterBlock = TipTapNode.create({
  name: 'counter',  // lo cambié a 'counter' para que coincida con el tipo de nodo
  group: 'block',
  content: 'inline*',
  defining: true,
  
  addAttributes() {
    return {
      count: {
        default: 0,
        parseHTML: element => ({
          count: parseInt(element.getAttribute('data-count') || '0', 10)
        }),
        renderHTML: attributes => ({
          'data-count': attributes.count
        })
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="counter"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { 
        'data-type': 'counter',
        'data-count': HTMLAttributes.count || 0,
        class: 'counter-block'
      }, 
      [
        'div', 
        { 
          class: 'counter-content',
          'data-count': HTMLAttributes.count || 0
        },
        [
          'div', 
          { class: 'counter-value' }, 
          `Contador: ${HTMLAttributes.count || 0}`
        ],
        [
          'button', 
          { 
            class: 'counter-button', 
            type: 'button',
            'data-count': HTMLAttributes.count || 0
          }, 
          'Incrementar'
        ]
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes }) => {
      const count = node.attrs.count || 0;
      
      const increment = () => {
        updateAttributes({
          count: count + 1,
        });
      };

      return (
        <NodeViewWrapper as="div" className="counter-block" data-count={count}>
          <div className="counter-content">
            <div className="counter-value">Contador: {count}</div>
            <button 
              type="button" 
              className="counter-button" 
              onClick={increment}
            >
              Incrementar
            </button>
          </div>
        </NodeViewWrapper>
      );
    });
  },
});

// Interfaces para los diálogos
interface DialogProps {
  onInsert: (data: any) => void;
  onClose: () => void;
}

interface ImageDialogProps extends DialogProps {
  onInsert: (url: string) => void;
}

interface CTADialogProps extends DialogProps {
  onInsert: (data: { text: string; url: string; newTab: boolean }) => void;
}

// Componente para el diálogo de CTA
const CTADialog: React.FC<CTADialogProps> = ({ onInsert, onClose }) => {
  const [text, setText] = useState('Haz clic aquí');
  const [url, setUrl] = useState('https://');
  const [newTab, setNewTab] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text && url) {
      onInsert({ text, url, newTab });
      onClose();
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>Insertar Llamado a la Acción</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Texto del botón:</label>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: Suscríbete ahora"
              required
            />
          </div>
          
          <div className="form-group">
            <label>URL de destino:</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              required
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newTab}
                onChange={(e) => setNewTab(e.target.checked)}
              />
              Abrir en nueva pestaña
            </label>
          </div>
          
          <div className="dialog-buttons">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="insert-button">
              Insertar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente para el diálogo de carga de imagen
const ImageDialog: React.FC<ImageDialogProps> = ({ onInsert, onClose }) => {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      onInsert(url);
      onClose();
    }
  };

  return (
    <div className="image-dialog-overlay">
      <div className="image-dialog">
        <h3>Insertar imagen desde URL</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            required
          />
          <div className="dialog-buttons">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button type="submit" className="insert-button">
              Insertar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal del editor
export const TiptapEditor = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showCTADialog, setShowCTADialog] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuQuery, setMenuQuery] = useState('');

  // Extensión personalizada para el bloque CTA
const CTABlock = TipTapNode.create({
  name: 'cta',
  group: 'block',
  content: 'inline*',
  defining: true,
  
  addAttributes() {
    return {
      text: {
        default: 'Haz clic aquí',
      },
      url: {
        default: 'https://',
      },
      newTab: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cta"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      { 
        'data-type': 'cta',
        'data-url': HTMLAttributes.url || 'https://',
        'data-new-tab': HTMLAttributes.newTab !== false,
        class: 'cta-block'
      }, 
      [
        'a', 
        { 
          href: HTMLAttributes.url || '#',
          target: HTMLAttributes.newTab !== false ? '_blank' : '_self',
          rel: 'noopener noreferrer',
          class: 'cta-button'
        },
        HTMLAttributes.text || 'Haz clic aquí'
      ]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, updateAttributes }) => {
      const text = node.attrs.text || 'Haz clic aquí';
      const url = node.attrs.url || 'https://';
      const newTab = node.attrs.newTab !== false;

      const handleClick = (e: React.MouseEvent) => {
        // Prevenir la propagación para que TipTap no maneje el evento
        e.stopPropagation();
        
        if (newTab) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
      };

      return (
        <NodeViewWrapper as="div" className="cta-block" contentEditable={false}>
          <button 
            className="cta-button"
            onClick={handleClick}
            style={{
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: 0,
              font: 'inherit',
              color: 'inherit',
              textAlign: 'inherit',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            {text}
          </button>
        </NodeViewWrapper>
      );
    });
  },
});

const editor = useEditor({
    extensions: [
      StarterKit,
      CounterBlock,
      CTABlock,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'custom-image',
        },
      }),
    ],
    content: '<p></p>',
    onUpdate: ({ editor }) => {
      const { state } = editor;
      const { selection } = state;
      const { $from } = selection;
      const text = $from.nodeBefore?.text || '';
      
      if (text.endsWith('/')) {
        const { top, left } = editor.view.coordsAtPos($from.pos - 1);
        setMenuPosition({ top: top + 24, left });
        setMenuQuery('');
        setShowMenu(true);
      } else if (showMenu) {
        setShowMenu(false);
      }
    },
  });

  const insertCounter = useCallback(() => {
    if (editor) {
      editor.commands.insertContent({
        type: 'counter',
        attrs: { count: 0 },
      });
      setShowMenu(false);
    }
  }, [editor]);

  const showCTADialogHandler = useCallback(() => {
    setShowCTADialog(true);
    setShowMenu(false);
  }, []);

  const insertCTA = useCallback(({ text, url, newTab }: { text: string; url: string; newTab: boolean }) => {
    if (editor) {
      editor.commands.insertContent({
        type: 'cta',
        attrs: { text, url, newTab },
      });
    }
  }, [editor]);

  const showImageDialogHandler = useCallback(() => {
    setShowImageDialog(true);
    setShowMenu(false);
  }, []);

  const insertImage = useCallback((url: string) => {
    if (editor) {
      editor.commands.setImage({ src: url });
    }
  }, [editor]);

  const commands = [
    {
      title: 'Contador',
      description: 'Añade un contador interactivo',
      onSelect: insertCounter,
    },
    {
      title: 'Imagen',
      description: 'Inserta una imagen desde una URL',
      onSelect: showImageDialogHandler,
    },
    {
      title: 'Botón CTA',
      description: 'Añade un botón de llamado a la acción',
      onSelect: showCTADialogHandler,
    },
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(menuQuery.toLowerCase()) ||
    command.description.toLowerCase().includes(menuQuery.toLowerCase())
  );

  return (
    <div className="editor-container">
      <EditorContent editor={editor} />
      
      {showImageDialog && (
        <ImageDialog
          onInsert={insertImage}
          onClose={() => setShowImageDialog(false)}
        />
      )}
      
      {showCTADialog && (
        <CTADialog
          onInsert={insertCTA}
          onClose={() => setShowCTADialog(false)}
        />
      )}
      
      {showMenu && (
        <div 
          className="command-menu" 
          style={{
            position: 'absolute',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <div className="command-menu-search">
            <input
              type="text"
              placeholder="Buscar comandos..."
              value={menuQuery}
              onChange={(e) => setMenuQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="command-list">
            {filteredCommands.map((command, index) => (
              <button
                key={index}
                className="command-item"
                onClick={() => {
                  command.onSelect();
                  setShowMenu(false);
                }}
              >
                <div className="command-title">{command.title}</div>
                <div className="command-description">{command.description}</div>
              </button>
            ))}
            {filteredCommands.length === 0 && (
              <div className="no-commands">No se encontraron comandos</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
