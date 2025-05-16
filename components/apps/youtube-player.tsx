"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player/youtube";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Video,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useTranslations } from 'next-intl';

// Types
interface PlaylistItem {
  id: string;
  url: string;
  title: string;
  addedAt: number; // Timestamp when added
}

// Constants
const DEFAULT_VOLUME = 50;
const DEFAULT_PLAYLIST: PlaylistItem[] = [
  {
    id: "jfKfPfyJRdk",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    addedAt: Date.now(),
  },
];

// Utility functions
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    /^[a-zA-Z0-9_-]{11}$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return "LIVE";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s}`;
  }
  return `${m.toString().padStart(2, "0")}:${s}`;
};

const isValidYouTubeId = (id: string | null | undefined) => {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);
};

// Components
const PlaylistItemComponent: React.FC<{
  item: PlaylistItem;
  index: number;
  isPlaying: boolean;
  isEditing: boolean;
  editingTitle: string;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (title: string) => void;
  onCancel: () => void;
  onTitleChange: (title: string) => void;
}> = ({
  item,
  index,
  isPlaying,
  isEditing,
  editingTitle,
  onPlay,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onTitleChange,
}) => {
  const t = useTranslations('components.youtubePlayer');
  
  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded p-1 cursor-pointer group",
        isPlaying && "bg-muted/50 font-bold"
      )}
      onClick={onPlay}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPlay();
      }}
      aria-label={t('playlist.item.play', { title: item.title })}
    >
      <Button size="sm" variant="ghost" tabIndex={-1}>
        {index + 1}
      </Button>
      <div className="flex items-center flex-1 min-w-0 justify-between">
        {isEditing ? (
          <div
            className="flex items-center gap-1 flex-1 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={editingTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave(editingTitle);
                if (e.key === "Escape") onCancel();
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onSave(editingTitle)}
              tabIndex={-1}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCancel} tabIndex={-1}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <span className="truncate flex-1">{item.title}</span>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={onEdit} 
                tabIndex={-1}
                aria-label={t('playlist.item.edit')}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                tabIndex={-1}
                aria-label={t('playlist.item.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </li>
  );
};

export function YouTubePlayer() {
  const t = useTranslations('components.youtubePlayer');
  const [playlist, setPlaylist] = useLocalStorage<PlaylistItem[]>(
    "youtube-playlist",
    DEFAULT_PLAYLIST
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [editingTitle, setEditingTitle] = useState("");

  // Player state
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(true);

  // Player ref
  const playerRef = useRef<ReactPlayer | null>(null);

  // Handlers for player controls
  const handlePlay = useCallback(() => {
    setPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setPlaying((prev) => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const handleToggleVideo = useCallback(() => {
    setShowVideo((prev) => !prev);
  }, []);

  // Error handling
  const handleError = useCallback((error: any) => {
    console.error("Player error:", error);
    setError(t('error'));
    toast.error(t('notifications.error.playback.title'), {
      description: t('notifications.error.playback.description'),
    });
  }, [t]);

  const handleReady = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleBufferEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleBufferStart = useCallback(() => {
    setLoading(true);
  }, []);

  // Playlist handlers
  const handlePrev = useCallback(() => {
    setCurrentIndex((idx) => (idx - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((idx) => (idx + 1) % playlist.length);
  }, [playlist.length]);

  const handleAdd = useCallback(() => {
    const id = extractYouTubeId(newUrl);
    if (!id) {
      toast.error(t('notifications.invalidUrl.title'), {
        description: t('notifications.invalidUrl.description'),
      });
      return;
    }

    // Duplicate check
    if (playlist.some((item) => item.id === id)) {
      toast(t('notifications.duplicate.title'), {
        description: t('notifications.duplicate.description'),
        duration: 4000,
      });
      setNewUrl("");
      return;
    }

    setLoading(true);

    // Validate video before adding
    fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    )
      .then((response) => {
        if (!response.ok) throw new Error("Video not found or not embeddable");
        return response.json();
      })
      .then((data) => {
        setPlaylist((prev) => [
          ...prev,
          {
            id,
            url: newUrl,
            title: data.title,
            addedAt: Date.now(),
          },
        ]);
        setNewUrl("");
        toast.success(t('notifications.added.title'), {
          description: t('notifications.added.description'),
        });
      })
      .catch((error) => {
        toast.error(t('notifications.error.title'), {
          description: error.message,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [newUrl, playlist, setPlaylist, t]);

  const handleRemove = useCallback(
    (idx: number) => {
      setPlaylist((prev) => prev.filter((_, i) => i !== idx));
      if (idx === currentIndex && idx === playlist.length - 1) {
        setCurrentIndex(Math.max(0, idx - 1));
      }
    },
    [currentIndex, playlist.length, setPlaylist]
  );

  const handleEditTitle = useCallback(
    (idx: number) => {
      setEditingIndex(idx);
      setEditingTitle(playlist[idx].title);
    },
    [playlist]
  );

  const saveEditedTitle = useCallback(() => {
    if (editingIndex === null) return;
    setPlaylist((prev) =>
      prev.map((item, idx) =>
        idx === editingIndex
          ? { ...item, title: editingTitle || item.title }
          : item
      )
    );
    setEditingIndex(null);
  }, [editingIndex, editingTitle, setPlaylist]);

  const handleResetAll = useCallback(() => {
    setPlaylist(DEFAULT_PLAYLIST);
    setCurrentIndex(0);
    setPlaying(true);
    setVolume(DEFAULT_VOLUME);
    setMuted(false);
    setShowVideo(true);
    setNewUrl("");
    setEditingIndex(null);
    setEditingTitle("");
    setLoading(false);
    setError(null);
    toast.success(t('notifications.reset.title'), {
      description: t('notifications.reset.description'),
    });
  }, [setPlaylist, t]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          setPlaying((prev) => !prev);
          break;
        case "ArrowLeft":
          if (e.altKey) handlePrev();
          break;
        case "ArrowRight":
          if (e.altKey) handleNext();
          break;
        case "KeyM":
          setMuted((prev) => !prev);
          break;
        case "KeyV":
          setShowVideo((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleNext, handlePrev]);

  // Video URL
  const videoUrl = playlist[currentIndex]?.id
    ? `https://www.youtube.com/watch?v=${playlist[currentIndex].id}`
    : "";

  return (
    <Card className="max-w-4xl mx-auto bg-background/90 backdrop-blur-sm border-border/50 p-4 space-y-4 h-full flex flex-col">
      <ScrollArea className="flex-1 w-full">
        <div className="space-y-4 pr-4">
          {/* YouTube Player */}
          {playlist[currentIndex] &&
            isValidYouTubeId(playlist[currentIndex].id) && (
              <div className="relative rounded-lg overflow-hidden bg-black">
                <div
                  className={cn(
                    "relative w-full aspect-video",
                    !showVideo && "hidden"
                  )}
                >
                  <ReactPlayer
                    ref={playerRef}
                    url={videoUrl}
                    width="100%"
                    height="100%"
                    playing={playing}
                    volume={volume / 100}
                    muted={muted}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onError={handleError}
                    onReady={handleReady}
                    onBuffer={handleBufferStart}
                    onBufferEnd={handleBufferEnd}
                    onEnded={handleNext}
                    controls={true}
                    config={
                      {
                        youtube: {
                          playerVars: {
                            modestbranding: 1,
                            rel: 0,
                            iv_load_policy: 3,
                          },
                        },
                      } as any
                    }
                    className="absolute inset-0"
                  />
                </div>

                {/* Overlay for errors and loading */}
                {(error || loading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    {error ? (
                      <div className="text-destructive text-center p-4">
                        <span className="block text-lg mb-2">⚠️</span>
                        {error}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-muted border-t-foreground rounded-full mb-2" />
                        <span className="text-sm">{t('loading')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Navigation Controls */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleVideo}
                className="hover:bg-muted"
              >
                <Video className="w-4 h-4 mr-2" />
                {showVideo ? t('controls.hideVideo') : t('controls.showVideo')}
              </Button>

              {/* Center Controls for Next/Previous */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={playlist.length < 2 || loading}
                  className="hover:bg-muted"
                  aria-label={t('controls.previous')}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="default"
                  onClick={handleTogglePlay}
                  disabled={!playlist[currentIndex] || loading}
                  className="bg-foreground hover:bg-foreground/90 text-background"
                  aria-label={playing ? t('controls.pause') : t('controls.play')}
                >
                  {playing ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNext}
                  disabled={playlist.length < 2 || loading}
                  className="hover:bg-muted"
                  aria-label={t('controls.next')}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {playlist[currentIndex]?.title ? (
                  <div className="font-medium truncate max-w-[200px]">
                    {playlist[currentIndex].title}
                  </div>
                ) : (
                  t('controls.noTrack')
                )}
              </div>
            </div>
          </div>

          {/* Playlist Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-zinc-200">{t('playlist.title')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                className="text-xs hover:bg-zinc-800"
              >
                {t('playlist.resetAll')}
              </Button>
            </div>

            {/* URL Input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder={t('playlist.urlInput.placeholder')}
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !loading &&
                    extractYouTubeId(newUrl)
                  ) {
                    handleAdd();
                  }
                }}
                className="flex-1 min-w-0 bg-muted/50 border-border/50"
                disabled={loading}
              />
              <Button
                onClick={handleAdd}
                disabled={!extractYouTubeId(newUrl) || loading}
                variant="default"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-muted border-t-foreground rounded-full mr-2" />
                    {t('playlist.urlInput.adding')}
                  </>
                ) : (
                  t('playlist.urlInput.add')
                )}
              </Button>
            </div>

            {/* Playlist */}
            <ScrollArea className="flex-1 w-full rounded-md border border-border/50 bg-muted/50">
              <ul className="space-y-1 p-2">
                {playlist.map((item, idx) => (
                  <PlaylistItemComponent
                    key={item.id}
                    item={item}
                    index={idx}
                    isPlaying={idx === currentIndex}
                    isEditing={editingIndex === idx}
                    editingTitle={editingTitle}
                    onPlay={() => {
                      if (loading) return;
                      setCurrentIndex(idx);
                      setPlaying(true);
                    }}
                    onEdit={() => handleEditTitle(idx)}
                    onDelete={() => handleRemove(idx)}
                    onSave={saveEditedTitle}
                    onCancel={() => setEditingIndex(null)}
                    onTitleChange={setEditingTitle}
                  />
                ))}
              </ul>
            </ScrollArea>

            {/* Keyboard Shortcuts */}
            <div className="mt-4 text-xs text-muted-foreground grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>{t('shortcuts.playPause')}</div>
              <div>{t('shortcuts.prevNext')}</div>
              <div>{t('shortcuts.mute')}</div>
              <div>{t('shortcuts.video')}</div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
