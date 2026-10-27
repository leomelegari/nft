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
      {images.length === 1 && active && (
        /*
          A lone artwork still gets the design's left rail, but not a tab: a
          button that cannot change anything is a control in name only, and it
          would duplicate for assistive tech what the main image already says.
        */
        <div aria-hidden="true" className="hidden shrink-0 sm:block sm:self-start">
          <div className="size-[100px] overflow-hidden rounded-lg border-2 border-primary">
            <Artwork src={active.src} alt="" className="size-full" />
          </div>
        </div>
      )}

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label={`Imagens de ${title}`}
          aria-orientation="vertical"
          className="flex gap-4 overflow-x-auto sm:flex-col sm:self-start sm:overflow-visible"
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

      <div className="flex min-w-0 flex-1 items-start justify-center rounded-xl bg-card p-4">
        {/*
          `h-auto` is load-bearing: `Artwork` ships `h-full`, so whenever this
          column was stretched by a taller neighbour the artwork grew with it —
          adding an item to the cart made the image jump 46px and, worse, it
          was never square to begin with, so `object-cover` was quietly
          cropping the piece.
        */}
        <Artwork
          src={active.src}
          alt={active.alt}
          size="detail"
          priority
          className="aspect-square h-auto w-full rounded-2xl"
        />
      </div>
    </div>
  )
}
