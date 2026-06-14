import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MasonryGrid from "@/components/MasonryGrid";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .single();

  if (albumError || !album) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", album.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-col flex-1">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to albums
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            {album.name}
          </h1>
          {album.description && (
            <p className="mt-3 text-gray-400 text-lg">{album.description}</p>
          )}
        </div>

        {!photos || photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              No photos in this album yet.
            </p>
          </div>
        ) : (
          <MasonryGrid>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid mb-4 rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Photo"}
                  className="w-full h-auto"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="p-3">
                    <p className="text-gray-300 text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </MasonryGrid>
        )}
      </div>
    </main>
  );
}
