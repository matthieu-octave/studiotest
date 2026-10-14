import { useState, useEffect, MouseEvent } from 'react';
import { Plus, Trash2, Search, Link2, FileText, ChevronRight, CornerDownLeft, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note } from '../types';

const PRESET_CATEGORIES = ['All', 'Architecture', 'Prompt', 'Code Snippet', 'Thoughts'];
const CARD_COLORS = [
  { name: 'Paper White', class: 'bg-white border-zinc-150' },
  { name: 'Warm Cream', class: 'bg-amber-50/60 border-amber-105' },
  { name: 'Soft Sage', class: 'bg-emerald-50/50 border-emerald-100' },
  { name: 'Muted Lilac', class: 'bg-indigo-50/50 border-indigo-100' },
  { name: 'Ice Cyan', class: 'bg-cyan-50/50 border-cyan-100' },
];

interface NotesSectionProps {
  onSendToCopilot: (promptText: string) => void;
}

export default function NotesSection({ onSendToCopilot }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Architecture');
  const [newColor, setNewColor] = useState(CARD_COLORS[0].class);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('developer-hub-scratchpad-notes');
      if (stored) {
        setNotes(JSON.parse(stored));
      } else {
        // Hydrate with cool default notes
        const defaultNotes: Note[] = [
          {
            id: 'note-1',
            title: 'Gemini Prompt Idea',
            content: 'Write a typescript function that recursively crawls an object structure to mask sensitive fields like "password", "token", or "creditCard".',
            color: 'bg-amber-50/60 border-amber-105',
            category: 'Prompt',
            createdAt: new Date().toLocaleDateString(),
          },
          {
            id: 'note-2',
            title: 'Hydration Pipeline Design',
            content: 'State client-side fetches first, store in React Context. Ensure SSR has empty values to prevent layout mismatches.',
            color: 'bg-indigo-50/50 border-indigo-100',
            category: 'Architecture',
            createdAt: new Date().toLocaleDateString(),
          }
        ];
        setNotes(defaultNotes);
        localStorage.setItem('developer-hub-scratchpad-notes', JSON.stringify(defaultNotes));
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  }, []);

  // Save on update
  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('developer-hub-scratchpad-notes', JSON.stringify(updatedNotes));
  };

  const handleCreateNote = () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    const added: Note = {
      id: `note-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      color: newColor,
      category: newCategory,
      createdAt: new Date().toLocaleDateString(),
    };

    const nextList = [added, ...notes];
    saveNotes(nextList);

    // reset forms
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleDeleteNote = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-100 flex flex-col justify-between h-full shadow-xs">
      {/* Scratchpad Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans font-medium text-xs tracking-wider text-zinc-400 uppercase">
            Shared Micro Scratchpad
          </span>
          <button
            id="btn-create-note-toggle"
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-950 text-white rounded-xl text-xs font-sans font-medium cursor-pointer hover:bg-zinc-800 transition-colors focus:outline-hidden"
          >
            {isCreating ? 'Close Form' : (
              <>
                <Plus size={13} />
                <span>New Note</span>
              </>
            )}
          </button>
        </div>

        {/* Searching and category selection */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input
              id="input-notes-search"
              type="text"
              placeholder="Search scratchpad notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 placeholder-zinc-400 text-xs px-9 py-2 rounded-xl focus:outline-hidden focus:border-zinc-300 focus:bg-white transition-all focus:ring-1 focus:ring-zinc-200 text-zinc-800"
            />
          </div>
          <div className="flex space-x-1 overflow-x-auto py-0.5 max-w-full md:max-w-[280px] scrollbar-none">
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`btn-tag-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-sans font-medium transition-colors cursor-pointer whitespace-nowrap focus:outline-hidden ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-white border-zinc-100 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Creation Block Section */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-zinc-50/50 rounded-2xl border border-zinc-100 p-4 mb-4"
          >
            <h4 className="text-xs font-sans font-semibold text-zinc-900 mb-3">Compose Scratchpad Note</h4>
            <div className="space-y-3">
              <div>
                <input
                  id="input-new-note-title"
                  type="text"
                  placeholder="Note Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-150 text-xs px-3 py-2 rounded-lg font-sans font-medium placeholder-zinc-400 text-zinc-800 focus:outline-hidden focus:border-zinc-300"
                />
              </div>
              <div>
                <textarea
                  id="input-new-note-content"
                  placeholder="Compose text, draft, prompt..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-zinc-150 text-xs px-3 py-2 rounded-lg font-sans placeholder-zinc-400 text-zinc-800 focus:outline-hidden focus:border-zinc-300"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Category selection */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-zinc-400 font-sans">Tag:</span>
                  <select
                    id="select-new-note-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="bg-white border border-zinc-150 rounded-lg text-xs px-2 py-1 font-sans text-zinc-700 focus:outline-hidden focus:border-zinc-350 cursor-pointer"
                  >
                    {PRESET_CATEGORIES.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color selects */}
                <div className="flex items-center space-x-1">
                  {CARD_COLORS.map((c, i) => (
                    <button
                      key={i}
                      id={`btn-color-select-${i}`}
                      type="button"
                      onClick={() => setNewColor(c.class)}
                      className={`w-4.5 h-4.5 rounded-full cursor-pointer transition-transform border ${c.class} ${
                        newColor === c.class ? 'scale-120 border-zinc-900 ring-1 ring-zinc-300' : 'opacity-80'
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>

                <button
                  id="btn-note-save"
                  onClick={handleCreateNote}
                  className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-850 rounded-lg text-xs font-sans font-medium cursor-pointer focus:outline-hidden"
                >
                  Save Note
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Notes list */}
      <div className="flex-1 overflow-y-auto max-h-[360px] min-h-[180px] space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-100">
        <AnimatePresence initial={false}>
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="text-zinc-250 mb-2" />
              <p className="text-xs font-sans font-medium text-zinc-400">No matching scratchpad notes</p>
              <span className="text-[10px] text-zinc-450 mt-1 block">Click "New Note" above to compose.</span>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`p-4 rounded-2xl border transition-all ${note.color} relative group active:scale-98`}
              >
                {/* Delete button option */}
                <button
                  id={`btn-delete-note-${note.id}`}
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 p-1 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all focus:outline-hidden"
                  title="Remove Note"
                >
                  <Trash2 size={13} />
                </button>

                <div className="flex items-center justify-between mb-1">
                  <span className="inline-block px-2 py-0.5 bg-white/70 rounded-md text-[9px] font-semibold text-zinc-500 font-sans border border-zinc-100">
                    {note.category}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 mr-5">
                    {note.createdAt}
                  </span>
                </div>

                <h5 className="font-sans font-semibold text-xs text-zinc-800 mb-1 select-text">
                  {note.title}
                </h5>

                <p className="font-sans text-xs text-zinc-650 leading-relaxed mb-3 select-text whitespace-pre-line">
                  {note.content}
                </p>

                {/* Direct action - copy to Copilot Prompt sandbox */}
                <div className="flex items-center justify-end">
                  <button
                    id={`btn-inject-copilot-${note.id}`}
                    onClick={() => onSendToCopilot(note.content)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 rounded-lg text-[10px] font-sans font-semibold shadow-2xs border border-zinc-100/80 transition-all cursor-pointer focus:outline-hidden"
                  >
                    <Sparkles size={11} className="text-amber-500 animate-pulse" />
                    <span>Send to Co-Pilot</span>
                    <CornerDownLeft size={10} className="text-zinc-400" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
