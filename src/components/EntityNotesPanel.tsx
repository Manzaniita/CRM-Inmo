import React, { useState, useRef } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { EntityNote } from '../types';
import Button from './Button';
import { Card } from './Card';
import { parseRichText } from '../lib/utils';

interface EntityNotesPanelProps {
  notes?: EntityNote[];
  onAddNote: (content: string) => void;
  onDeleteNote?: (noteId: string) => void;
  title?: string;
}

export default function EntityNotesPanel({
  notes = [],
  onAddNote,
  onDeleteNote,
  title = 'Notas Históricas'
}: EntityNotesPanelProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = () => {
    const trimmed = newNoteContent.trim();
    if (!trimmed) return;
    onAddNote(trimmed);
    setNewNoteContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
      return;
    }

    if (e.ctrlKey) {
      const key = e.key.toLowerCase();
      let tag = '';
      if (key === 'b') tag = '**';
      else if (key === 'u' || key === 's') tag = '__';
      else return;

      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const before = value.substring(0, start);
      const selected = value.substring(start, end);
      const after = value.substring(end);

      const newValue = before + tag + selected + tag + after;
      setNewNoteContent(newValue);

      requestAnimationFrame(() => {
        textarea.selectionStart = start + tag.length;
        textarea.selectionEnd = end + tag.length;
        textarea.focus();
      });
    }
  };

  const handleDelete = (noteId: string) => {
    if (!onDeleteNote) return;
    if (window.confirm('¿Eliminar esta nota?')) {
      onDeleteNote(noteId);
    }
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Card title={title}>
      <div className="space-y-4">
        {/* New note input */}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder="Escribir nueva nota..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="primary"
            size="sm"
            className="self-end"
            onClick={handleAdd}
            disabled={!newNoteContent.trim()}
          >
            <Plus size={16} className="mr-1" /> Agregar
          </Button>
        </div>

        {/* Notes list */}
        {notes.length === 0 && (
          <p className="text-xs text-center text-gray-400 py-4 italic">
            Sin notas históricas.
          </p>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {[...notes]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((note) => (
              <div
                key={note.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-gray-800 whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: parseRichText(note.content) }}
                  />
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-medium">
                    <Clock size={10} />
                    <span>{formatDateTime(note.createdAt)}</span>
                  </div>
                </div>
                {onDeleteNote && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Eliminar nota"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
}