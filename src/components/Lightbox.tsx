import React, { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X size={28} />
      </button>

      {images.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <div className="relative max-w-5xl max-h-[85vh] w-full px-4 flex flex-col items-center">
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1} de ${images.length}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="mt-4 text-white/70 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}
