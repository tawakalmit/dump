import { supabase } from "@/lib/supabase";
import HeroSection from "@/components/HeroSection";
import AlbumCard from "@/components/AlbumCard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: albums } = await supabase
    .from("albums")
    .select("*, photos(count)")
    .order("created_at", { ascending: false });

  return (
    <main className="flex flex-col flex-1">
      <HeroSection />

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8">Albums</h2>

        {!albums || albums.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No albums yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Check back later for new content.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {albums.map((album) => {
              const photoCount =
                album.photos?.[0]?.count ?? 0;
              return (
                <AlbumCard
                  key={album.id}
                  album={album}
                  photoCount={photoCount}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
