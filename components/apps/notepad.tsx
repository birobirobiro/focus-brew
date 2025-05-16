"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { enUS, ptBR } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import {
  Plus,
  Trash,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Search,
  Save,
  Undo,
  Redo,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Toggle } from "@/components/ui/toggle";
import { cn, formatShortcut } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const AUTOSAVE_DELAY = 1000; // 1 second

export function Notepad() {
  const t = useTranslations('components.notepad');
  const locale = useLocale();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const [notes, setNotes] = useLocalStorage<Note[]>("notepad-notes", []);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "idle">(
    "idle"
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const selectedNote = selectedNoteId
    ? notes.find((note) => note.id === selectedNoteId)
    : null;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
      }),
      Placeholder.configure({
        placeholder: "Start typing...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: selectedNote?.content || "",
    onUpdate: ({ editor }) => {
      if (selectedNoteId) {
        setSaveStatus("saving");
        const timeoutId = setTimeout(() => {
          updateNoteContent(selectedNoteId, editor.getHTML());
          setSaveStatus("saved");
        }, AUTOSAVE_DELAY);
        return () => clearTimeout(timeoutId);
      }
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[150px] p-4 focus:ring-0",
      },
    },
  });

  useEffect(() => {
    if (editor && selectedNote) {
      editor.commands.setContent(selectedNote.content);
    }
  }, [selectedNoteId, editor, selectedNote]);

  // Focus editor when selecting a note
  useEffect(() => {
    if (selectedNote && editor && !editor.isFocused && !isTitleFocused) {
      // Don't auto-focus the editor when creating a new empty note or when title is focused
      if (selectedNote.title === "" && selectedNote.content === "") {
        return;
      }

      setTimeout(() => {
        editor.commands.focus("end");
      }, 100);
    }
  }, [selectedNote, editor, isTitleFocused]);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createNewNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes([...notes, newNote]);
    setSelectedNoteId(newNote.id);
    setSaveStatus("idle");

    // Add a slight delay to ensure the DOM has updated before focusing
    setTimeout(() => {
      const titleInput = document.querySelector(
        'input[placeholder="Note title"]'
      ) as HTMLInputElement;
      if (titleInput) titleInput.focus();
    }, 100);
  }, [notes, setNotes]);

  const updateNoteTitle = useCallback(
    (id: string, title: string) => {
      setSaveStatus("saving");
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, title, updatedAt: Date.now() } : note
        )
      );
      setTimeout(() => setSaveStatus("saved"), AUTOSAVE_DELAY);
    },
    [setNotes]
  );

  const updateNoteContent = useCallback(
    (id: string, content: string) => {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, content, updatedAt: Date.now() } : note
        )
      );
    },
    [setNotes]
  );

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "l":
            e.preventDefault();
            setIsSearching(true);
            break;
          case "s":
            e.preventDefault();
            if (selectedNoteId && editor) {
              updateNoteContent(selectedNoteId, editor.getHTML());
              setSaveStatus("saved");
              toast({
                title: t('notifications.saved.title'),
                description: t('notifications.saved.description'),
              });
            }
            break;
          case "b":
            e.preventDefault();
            createNewNote();
            break;
          case "z":
            if (e.shiftKey) {
              e.preventDefault();
              editor?.commands.redo();
            } else {
              e.preventDefault();
              editor?.commands.undo();
            }
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, selectedNoteId, createNewNote, updateNoteContent, t]);

  const deleteNote = (id: string) => {
    setNoteToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      if (selectedNoteId === noteToDelete) {
        setSelectedNoteId(null);
      }
      setNotes(notes.filter((note) => note.id !== noteToDelete));
      setNoteToDelete(null);
      setIsDeleteDialogOpen(false);
      toast({
        title: t('notifications.deleted.title'),
        description: t('notifications.deleted.description'),
      });
    }
  };

  return (
    <div className="flex h-full border-border bg-background">
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex flex-col gap-2">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search.placeholder', { shortcut: formatShortcut("L") })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full"
              onFocus={() => setIsSearching(true)}
              onBlur={() => {
                if (!searchQuery) {
                  setIsSearching(false);
                }
              }}
            />
          </div>
          <Button onClick={createNewNote} size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            {t('actions.new', { shortcut: formatShortcut("B") })}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <AnimatePresence>
            {filteredNotes.length === 0 ? (
              <motion.div
                key="empty-notes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 text-center text-zinc-500"
              >
                {searchQuery
                  ? t('search.noResults')
                  : t('notes.empty')}
              </motion.div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={`note-item-${note.id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      onClick={() => setSelectedNoteId(note.id)}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedNoteId === note.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-background hover:border-border/80"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium truncate mb-1">
                              {note.title || t('notes.untitled')}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(note.updatedAt), "PPP", { locale: dateLocale })}
                              </span>
                              <span>•</span>
                              <span>
                                {format(new Date(note.updatedAt), "p", { locale: dateLocale })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedNote ? (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <Input
                value={selectedNote.title}
                onChange={(e) =>
                  updateNoteTitle(selectedNote.id, e.target.value)
                }
                placeholder={t('notes.titlePlaceholder')}
                className="font-medium mb-3"
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
              />

              <div className="flex flex-wrap items-center gap-1">
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("bold")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleBold().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("italic")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleItalic().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("heading", { level: 1 })}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Heading1 className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("heading", { level: 2 })}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("bulletList")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <List className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("orderedList")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("blockquote")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Quote className="h-3.5 w-3.5" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor?.isActive("codeBlock")}
                  onPressedChange={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  className="data-[state=on]:bg-primary/20"
                >
                  <Code className="h-3.5 w-3.5" />
                </Toggle>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {saveStatus === "saving"
                      ? t('status.saving')
                      : saveStatus === "saved"
                      ? t('status.saved')
                      : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editor?.commands.undo()}
                      disabled={!editor?.can().undo()}
                      title={t('actions.undo')}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => editor?.commands.redo()}
                      disabled={!editor?.can().redo()}
                      title={t('actions.redo')}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div ref={editorRef} className="h-full">
                <EditorContent
                  editor={editor}
                  className="prose dark:prose-invert max-w-none editor-content h-full"
                />
              </div>
              <style jsx global>{`
                .editor-content .ProseMirror {
                  min-height: 150px;
                  line-height: 1.6;
                  padding: 1rem;
                  outline: none !important;
                }

                .editor-content .ProseMirror p {
                  margin-bottom: 1rem;
                }

                .editor-content .ProseMirror h1 {
                  font-size: 1.75rem;
                  margin-top: 1.5rem;
                  margin-bottom: 1rem;
                  font-weight: 600;
                }

                .editor-content .ProseMirror h2 {
                  font-size: 1.5rem;
                  margin-top: 1.25rem;
                  margin-bottom: 0.75rem;
                  font-weight: 600;
                }

                .editor-content .ProseMirror ul,
                .editor-content .ProseMirror ol {
                  padding-left: 1.5rem;
                  margin-bottom: 1rem;
                }

                .editor-content .ProseMirror li {
                  margin-bottom: 0.25rem;
                }

                .editor-content .ProseMirror blockquote {
                  border-left: 3px solid var(--primary);
                  padding-left: 1rem;
                  margin: 1.5rem 0;
                  font-style: italic;
                  color: var(--muted-foreground);
                }

                .editor-content .ProseMirror code {
                  background-color: var(--muted);
                  color: var(--foreground);
                  padding: 0.2em 0.4em;
                  border-radius: 0.25rem;
                  font-size: 0.875em;
                }

                .editor-content .ProseMirror pre {
                  background: var(--muted);
                  color: var(--foreground);
                  font-family: "JetBrainsMono", monospace;
                  padding: 0.75rem 1rem;
                  border-radius: 0.5rem;
                  margin: 1rem 0;
                  overflow-x: auto;
                }

                .editor-content .ProseMirror pre code {
                  color: inherit;
                  padding: 0;
                  background: none;
                  font-size: 0.875rem;
                }

                .editor-content .is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  float: left;
                  color: var(--muted-foreground);
                  pointer-events: none;
                  height: 0;
                }

                .editor-content
                  .ProseMirror
                  p.is-editor-empty:first-child::before {
                  color: var(--muted-foreground);
                  content: attr(data-placeholder);
                  float: left;
                  height: 0;
                  pointer-events: none;
                }
              `}</style>
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="text-center">
              <p className="mb-2">{t('notes.selectOrCreate')}</p>
              <p className="text-sm">
                {t.rich('notes.createShortcut', {
                  shortcut: () => (
                    <kbd className="px-2 py-1 bg-muted rounded">
                      {formatShortcut("B")}
                    </kbd>
                  )
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
