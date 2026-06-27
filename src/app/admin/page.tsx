"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminScopeClient } from "@/lib/admin-scope";

interface Album {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  description: string | null;
  created_at: string;
  photos: { count: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string | null>(null);

  useEffect(() => {
    setScope(getAdminScopeClient());
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch {
      console.error("Failed to fetch albums");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {!scope && (
              <Link
                href="/admin/categories"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-700 transition-colors"
              >
                Categories
              </Link>
            )}
            <Link
              href="/admin/albums/new"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Create New Album
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg border border-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading albums...</div>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No albums yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first album to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => {
              const photoCount = album.photos?.[0]?.count ?? 0;
              return (
                <Link
                  key={album.id}
                  href={`/admin/albums/${album.id}`}
                  className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all"
                >
                  <div className="aspect-video bg-gray-800 relative overflow-hidden">
                    {album.cover_photo_url ? (
                      <img
                        src={album.cover_photo_url}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                      {album.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {photoCount} {photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
