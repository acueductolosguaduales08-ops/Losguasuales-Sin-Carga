import { useState } from 'react';
import { Bold, Heading1, Heading2, List, ListOrdered, Table2, Link2, AlignLeft, AlignCenter, AlignRight, Check, X } from 'lucide-react';

// Inserta una etiqueta de apertura/cierre alrededor del texto seleccionado en el textarea.
function wrapSelection(textareaRef, openTag, closeTag = '') {
  const textarea = textareaRef.current;
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);
  const replacement = openTag + selected + closeTag;
  const newValue = text.substring(0, start) + replacement + text.substring(end);

  textarea.value = newValue;
  textarea.focus();
  if (selected.length === 0) textarea.selectionEnd = start + openTag.length;
  else textarea.selectionEnd = start + replacement.length;

  return newValue;
}

export default function RichTextToolbar({ textareaRef, onChange }) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const apply = (open, close = '') => {
    const newValue = wrapSelection(textareaRef, open, close);
    if (newValue !== undefined) onChange(newValue);
  };

  const insertList = (type) => apply(`<${type}>\n  <li>`, `</li>\n</${type}>\n`);

  const insertTable = () =>
    apply(
      `<table style="width:100%; border-collapse: collapse;">\n  <tr>\n    <th style="border:1px solid #cbd5e1; padding:8px;">Columna 1</th>\n    <th style="border:1px solid #cbd5e1; padding:8px;">Columna 2</th>\n  </tr>\n  <tr>\n    <td style="border:1px solid #cbd5e1; padding:8px;">Dato A</td>\n    <td style="border:1px solid #cbd5e1; padding:8px;">Dato B</td>\n  </tr>\n</table>\n`
    );

  const confirmarLink = () => {
    const url = linkUrl.trim();
    if (url) apply(`<a href="${url}" target="_blank" rel="noreferrer">`, '</a>');
    setLinkUrl('');
    setLinkPopoverOpen(false);
  };

  const buttons = [
    { icon: Heading1, title: 'Título 1', action: () => apply('<h1>', '</h1>') },
    { icon: Heading2, title: 'Título 2', action: () => apply('<h2>', '</h2>') },
    { icon: Bold, title: 'Negrita', action: () => apply('<b>', '</b>') },
    { icon: List, title: 'Lista con viñetas', action: () => insertList('ul') },
    { icon: ListOrdered, title: 'Lista numerada', action: () => insertList('ol') },
    { icon: Table2, title: 'Tabla', action: insertTable },
    { icon: AlignLeft, title: 'Alinear izquierda', action: () => apply("<div style='text-align:left;'>", '</div>') },
    { icon: AlignCenter, title: 'Centrar', action: () => apply("<div style='text-align:center;'>", '</div>') },
    { icon: AlignRight, title: 'Alinear derecha', action: () => apply("<div style='text-align:right;'>", '</div>') },
  ];

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 bg-gray-100 dark:bg-gray-900 p-2 rounded-t-xl border border-gray-200 dark:border-white/10 border-b-0">
        {buttons.slice(0, 6).map(({ icon: Icon, title, action }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        {/* Botón de enlace: abre un popover propio, no un prompt del navegador */}
        <button
          type="button"
          title="Enlace"
          onClick={() => setLinkPopoverOpen((v) => !v)}
          className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
            linkPopoverOpen
              ? 'bg-brand border-brand text-white'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Link2 className="w-4 h-4" />
        </button>

        {buttons.slice(6).map(({ icon: Icon, title, action }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={action}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {linkPopoverOpen && (
        <div className="absolute left-0 top-full mt-1 z-20 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-2 w-72">
          <input
            type="url"
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmarLink();
              }
              if (e.key === 'Escape') setLinkPopoverOpen(false);
            }}
            placeholder="https://tu-enlace.com"
            className="flex-1 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
          />
          <button
            type="button"
            onClick={confirmarLink}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-dark shrink-0"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setLinkPopoverOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
