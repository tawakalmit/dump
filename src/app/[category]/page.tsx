import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import slugify from "@/lib/slugify";
import AlbumCard from "@/components/AlbumCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;

  const { data: albums } = await supabase
    .from("albums")
    .select("*, photos(count)")
    .order("created_at", { ascending: false });

  // Match albums whose (slugified) category equals the URL segment.
  const matched = (albums ?? []).filter((album) => {
    const albumCategory = album.category
      ? slugify(album.category)
      : "uncategorized";
    return albumCategory === category;
  });

  if (matched.length === 0) {
    notFound();
  }

  // Use the original category name for display (fallback to the slug).
  const categoryName = matched[0].category || "Uncategorized";

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
          <p className="text-red-400 text-sm font-medium uppercase tracking-wide mb-2">
            Category
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white capitalize">
            {categoryName}
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            {matched.length} {matched.length === 1 ? "album" : "albums"}
          </p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {matched.map((album) => {
            const photoCount = album.photos?.[0]?.count ?? 0;
            return (
              <AlbumCard
                key={album.id}
                album={album}
                photoCount={photoCount}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
