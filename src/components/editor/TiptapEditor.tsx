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
  name: 'counter',  // Cambiado a 'counter' para que coincida con el tipo de nodo
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

// Tipos para las props del diálogo de imagen
interface ImageDialogProps {
  onInsert: (url: string) => void;
  onClose: () => void;
}

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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuQuery, setMenuQuery] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      CounterBlock,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'custom-image',
        },
      }),
    ],
    content: '<p>Escribe / para ver los comandos</p>',
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
