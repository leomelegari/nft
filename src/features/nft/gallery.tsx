import { useState } from 'react'
import { Artwork } from '@/shared/ui/artwork'
import { cn } from '@/shared/lib/utils'

/**
 * Product gallery: a column of thumbnails beside the main image on desktop,
 * a row beneath it on mobile.
 *
 * Implemented as a tablist so arrow keys move between thumbnails and the
 * selected one is announced — in the Figma the selection is a border colour
 * with no semantics attached.
 */
export function NftGallery({
  images,
  title,
}: {
  images: Array<{ src: string; alt: string }>
  title: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? images[0]

  if (!active) return null

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`Imagens de ${title}`}
          aria-orientation="vertical"
          className="flex gap-4 overflow-x-auto sm:flex-col sm:overflow-visible"
        >
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Imagem ${index + 1} de ${images.length}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'size-[100px] shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-ring',
                index === activeIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-border-soft',
              )}
            >
              <Artwork src={image.src} alt="" className="size-full" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center rounded-xl bg-card p-4">
        <Artwork
          src={active.src}
          alt={active.alt}
          size="detail"
          priority
          className="aspect-square rounded-2xl"
        />
      </div>
    </div>
  )
}
