import { cn } from '@/shared/lib/utils'

/**
 * NFT artwork.
 *
 * The API returns a size-less base path (`/nft/artwork-01`) and the client
 * requests a rendition, the way an image CDN is addressed. Two renditions are
 * published: 500px for catalog cards and 900px for the detail gallery.
 *
 * `width`/`height` are always set so the box is reserved before the image
 * loads — layout shift is a scored Lighthouse metric and a stated requirement.
 */
const RENDITIONS = [500, 900] as const

type ArtworkSize = 'card' | 'detail'

const SIZES: Record<ArtworkSize, string> = {
  // Cards: 3 per row at desktop inside a 842px grid, 2 per row on mobile.
  card: '(min-width: 1024px) 258px, (min-width: 640px) 45vw, 42vw',
  detail: '(min-width: 1024px) 450px, 90vw',
}

export function Artwork({
  src,
  alt,
  size = 'card',
  className,
  priority = false,
}: {
  src: string
  alt: string
  size?: ArtworkSize
  className?: string
  /** Set on the LCP candidate only; everything else stays lazy. */
  priority?: boolean
}) {
  const srcSet = RENDITIONS.map((width) => `${src}-${width}.webp ${width}w`).join(', ')

  return (
    <img
      src={`${src}-${size === 'card' ? 500 : 900}.webp`}
      srcSet={srcSet}
      sizes={SIZES[size]}
      alt={alt}
      width={size === 'card' ? 500 : 900}
      height={size === 'card' ? 500 : 900}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('block h-full w-full object-cover', className)}
    />
  )
}
