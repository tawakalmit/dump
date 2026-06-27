import Link from "next/link";
import Image from "next/image";
import {
  getCloudinaryThumbnail,
  getCloudinaryVideoThumbnail,
  isVideo,
} from "@/lib/cloudinary-url";
import slugify from "@/lib/slugify";

interface Album {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  description: string | null;
  category: string | null;
}

interface AlbumCardProps {
  album: Album;
  photoCount: number;
}

export default function AlbumCard({ album, photoCount }: AlbumCardProps) {
  const categorySlug = album.category
    ? slugify(album.category)
    : "uncategorized";

  return (
    <Link
      href={`/${categorySlug}/${album.slug}`}
      className="group block break-inside-avoid mb-4"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-lg transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl">
        {album.cover_photo_url ? (
          <Image
            src={
              isVideo(album.cover_photo_url)
                ? getCloudinaryVideoThumbnail(album.cover_photo_url, 600)
                : getCloudinaryThumbnail(album.cover_photo_url, 600)
            }
            alt={album.name}
            width={400}
            height={300}
            className="w-full h-auto object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg truncate drop-shadow-lg">
            {album.name}
          </h3>
          <p className="text-gray-300 text-sm mt-1">
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </p>
        </div>
      </div>
    </Link>
  );
}
