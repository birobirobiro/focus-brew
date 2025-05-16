import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Upload } from "lucide-react";
import { useTranslations } from 'next-intl';

interface WallpaperTabProps {
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  selectedWallpaper: string;
  setSelectedWallpaper: (wallpaper: string) => void;
  customWallpapers: string[];
  setCustomWallpapers: (wallpapers: string[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  wallpapers: string[];
}

interface WallpaperTileProps {
  src: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  altText: string;
}

const DEFAULT_WALLPAPER = "/wallpapers/default.webp";

const WallpaperTile: React.FC<WallpaperTileProps> = ({
  src,
  isSelected,
  onSelect,
  onDelete,
  altText,
}) => {
  const t = useTranslations('components.settings.wallpaper');
  
  return (
    <div
      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
        isSelected ? "border-primary" : "border-transparent"
      }`}
      onClick={onSelect}
    >
      <img
        src={src || "/placeholder.svg"}
        alt={altText}
        className="w-full h-32 object-cover"
        onError={(e) => {
          console.error(`Failed to load wallpaper: ${src}`);
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-4 w-4" />
        </div>
      )}
      {onDelete && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute bottom-2 right-2 h-6 w-6 min-w-0 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t('buttons.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export function SettingsWallpaperTab({
  wallpaper,
  setWallpaper,
  selectedWallpaper,
  setSelectedWallpaper,
  customWallpapers,
  setCustomWallpapers,
  fileInputRef,
  handleFileUpload,
  wallpapers,
}: WallpaperTabProps) {
  const t = useTranslations('components.settings.wallpaper');

  const handleWallpaperSelect = useCallback(
    (wp: string) => {
      setSelectedWallpaper(wp);
      setWallpaper(wp);
    },
    [setSelectedWallpaper, setWallpaper]
  );

  const handleCustomWallpaperDelete = useCallback(
    (index: number, wp: string) => {
      try {
        const updated = customWallpapers.filter((_, i) => i !== index);
        setCustomWallpapers(updated);
        localStorage.setItem("custom_wallpapers", JSON.stringify(updated));

        if (selectedWallpaper === wp) {
          handleWallpaperSelect(DEFAULT_WALLPAPER);
        }
      } catch (error) {
        console.error("Failed to delete custom wallpaper:", error);
      }
    },
    [
      customWallpapers,
      selectedWallpaper,
      setCustomWallpapers,
      handleWallpaperSelect,
    ]
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1">{t('title')}</h2>
        <p className="text-muted-foreground text-xs mb-4">
          {t('description')}
        </p>
        <div className="grid grid-cols-2 gap-4">
          {wallpapers.map((wp) => (
            <WallpaperTile
              key={wp}
              src={wp}
              isSelected={selectedWallpaper === wp}
              onSelect={() => handleWallpaperSelect(wp)}
              altText={t('defaultWallpaper')}
            />
          ))}
          {customWallpapers.map((wp, index) => (
            <WallpaperTile
              key={`custom-${index}`}
              src={wp}
              isSelected={selectedWallpaper === wp}
              onSelect={() => handleWallpaperSelect(wp)}
              onDelete={() => handleCustomWallpaperDelete(index, wp)}
              altText={t('customWallpaper', { index: index + 1 })}
            />
          ))}
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1">{t('custom.title')}</h2>
        <p className="text-muted-foreground text-xs mb-4">
          {t('custom.description')}
        </p>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="bg-background/50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('buttons.upload')}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </>
  );
}
