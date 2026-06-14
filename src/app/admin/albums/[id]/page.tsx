"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Album {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  description: string | null;
  created_at: string;
}

interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  storage_path: string;
  created_at: string;
}

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchAlbum = useCallback(async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      if (res.ok) {
        const data = await res.json();
        setAlbum(data);
        setName(data.name);
        setDescription(data.description || "");
      }
    } catch {
      console.error("Failed to fetch album");
    }
  }, [albumId]);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch {
      console.error("Failed to fetch photos");
    }
  }, [albumId]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchAlbum(), fetchPhotos()]);
      setLoading(false);
    };
    load();
  }, [fetchAlbum, fetchPhotos]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlbum(data);
        setMessage({ type: "success", text: "Album updated successfully" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch(`/api/albums/${albumId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          setMessage({
            type: "error",
            text: data.error || `Failed to upload ${files[i].name}`,
          });
        }
      }

      await fetchPhotos();
      setMessage({ type: "success", text: "Photos uploaded successfully" });
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSetCover = async (photoId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/albums/${albumId}/photos/${photoId}`, {
        method: "PUT",
      });

      if (res.ok) {
        await fetchAlbum();
        setMessage({ type: "success", text: "Cover photo updated" });
      } else {
        setMessage({ type: "error", text: "Failed to set cover" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/albums/${albumId}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        setMessage({ type: "success", text: "Photo deleted" });
      } else {
        setMessage({ type: "error", text: "Failed to delete photo" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  const handleDeleteAlbum = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this album? This will also delete all photos in it."
      )
    )
      return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setMessage({ type: "error", text: "Failed to delete album" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!album) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Album not found</p>
          <Link
            href="/admin"
            className="text-red-400 hover:text-red-300 mt-4 inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-500/10 border border-green-500/50 text-green-400"
                : "bg-red-500/10 border border-red-500/50 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Album Details Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Edit Album</h1>
            <button
              onClick={handleDeleteAlbum}
              className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 font-medium rounded-lg border border-red-800 transition-colors text-sm"
            >
              Delete Album
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Album Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Photo Upload Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Upload Photos</h2>
          <div className="flex items-center gap-4">
            <label className="flex-1 relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-center px-6 py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-gray-500 transition-colors">
                <div className="text-center">
                  <svg
                    className="mx-auto w-10 h-10 text-gray-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-gray-400 text-sm">
                    {uploading
                      ? "Uploading..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    PNG, JPG, GIF, WebP
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-4">
            Photos ({photos.length})
          </h2>

          {photos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No photos yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Upload some photos to this album.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => {
                const isCover = album.cover_photo_url === photo.url;
                return (
                  <div
                    key={photo.id}
                    className={`relative group rounded-xl overflow-hidden border-2 ${
                      isCover
                        ? "border-red-500"
                        : "border-transparent hover:border-gray-700"
                    } transition-colors`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || "Photo"}
                        className="w-full h-full object-cover"
                      />
                      {isCover && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-md">
                          Cover
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!isCover && (
                        <button
                          onClick={() => handleSetCover(photo.id)}
                          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                        >
                          Set as Cover
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
