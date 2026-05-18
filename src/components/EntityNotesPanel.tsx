import React, { useState } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { EntityNote } from '../types';
import Button from './Button';
import { Card } from './Card';

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

  const handleAdd = () => {
    const trimmed = newNoteContent.trim();
    if (!trimmed) return;
    onAddNote(trimmed);
    setNewNoteContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
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
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
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