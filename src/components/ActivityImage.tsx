import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ActivityImageProps {
  title: string;
  displayTitle?: string;
  imageUrl?: string | null;
  unsplashKeywords?: string | null;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  onClick?: () => void;
}

export default function ActivityImage({
  title,
  displayTitle,
  imageUrl,
  unsplashKeywords,
  className = '',
  aspectRatio = 'video',
  onClick
}: ActivityImageProps) {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackImage = `https://source.unsplash.com/800x600/?${encodeURIComponent(
    unsplashKeywords || title
  )}`;

  const imageToShow = !hasError && imageUrl ? imageUrl : fallbackImage;

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[2/1]'
  };

  return (
    <div
      className={`relative overflow-hidden rounded-t-lg ${aspectRatioClasses[aspectRatio]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      className={`relative overflow-hidden rounded-t-lg ${aspectRatioClasses[aspectRatio]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Loading shimmer */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse z-10" />
      )}

      {/* Error fallback icon if both fail */}
      {hasError && !imageUrl && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <ImageOff className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <img
        src={imageToShow}
        alt={displayTitle || title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setHasError(true);
          setLoading(false);
        }}
      />
    </div>
  );
}