/**
 * Cloudinary URL transformation utilities.
 *
 * Cloudinary URLs follow this pattern:
 *   https://res.cloudinary.com/{cloud}/image/upload/v123/folder/image.jpg
 *
 * Transformations are inserted between `/upload/` and the version/path:
 *   https://res.cloudinary.com/{cloud}/image/upload/w_600,q_auto,f_auto/v123/folder/image.jpg
 */

/**
 * Insert transformation parameters into a Cloudinary URL after `/upload/`.
 * If the URL is not a valid Cloudinary upload URL, returns it unchanged.
 */
function insertTransformation(url: string, transformation: string): string {
  const uploadSegment = "/upload/";
  const index = url.indexOf(uploadSegment);

  if (index === -1) {
    return url;
  }

  const before = url.slice(0, index + uploadSegment.length);
  const after = url.slice(index + uploadSegment.length);

  return `${before}${transformation}/${after}`;
}

/**
 * Returns a thumbnail version of the Cloudinary URL.
 * Uses c_fill for consistent cropping in grids.
 *
 * @param url - Original Cloudinary URL
 * @param width - Target width in pixels (default: 600)
 */
export function getCloudinaryThumbnail(
  url: string,
  width: number = 600
): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  return insertTransformation(url, `w_${width},q_auto,f_auto,c_fill`);
}

/**
 * Returns an optimized version of the Cloudinary URL for medium-size display.
 * Uses width constraint without forced cropping (preserves aspect ratio).
 *
 * @param url - Original Cloudinary URL
 * @param width - Target width in pixels (default: 1200)
 */
export function getCloudinaryOptimized(
  url: string,
  width: number = 1200
): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  return insertTransformation(url, `w_${width},q_auto,f_auto`);
}

/**
 * Determines whether a media item is a video.
 * Prefers the explicit `mediaType` when available, otherwise falls back to
 * inspecting the Cloudinary URL (video assets are served from `/video/upload/`).
 *
 * @param url - Media URL
 * @param mediaType - Optional explicit media type ("image" | "video")
 */
export function isVideo(
  url: string,
  mediaType?: string | null
): boolean {
  if (mediaType) {
    return mediaType === "video";
  }
  return !!url && url.includes("/video/upload/");
}

/**
 * Generates a still-image thumbnail (poster) from a Cloudinary video URL.
 * Cloudinary creates a thumbnail when a video asset is requested with an
 * image extension (e.g. `.jpg`), so we swap the extension and apply transforms.
 *
 * @param url - Original Cloudinary video URL
 * @param width - Target width in pixels (default: 600)
 */
export function getCloudinaryVideoThumbnail(
  url: string,
  width: number = 600
): string {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const withTransform = insertTransformation(
    url,
    `w_${width},q_auto,c_fill`
  );

  // Swap the video file extension for `.jpg` to request a poster frame.
  return withTransform.replace(/\.(mp4|mov|webm|avi|mkv|ogv|m4v)$/i, ".jpg");
}
