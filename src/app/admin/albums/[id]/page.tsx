"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isVideo, getCloudinaryVideoThumbnail } from "@/lib/cloudinary-url";

interface Album {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
}

interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  storage_path: string;
  media_type: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

type UploadFileStatus = "pending" | "uploading" | "done" | "failed";

interface UploadFileState {
  file: File;
  status: UploadFileStatus;
  error?: string;
  previewUrl: string;
}

const CONCURRENCY_LIMIT = 5;

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadedCount = uploadFiles.filter((f) => f.status === "done").length;
  const failedCount = uploadFiles.filter((f) => f.status === "failed").length;
  const totalCount = uploadFiles.length;
  const progressPercent =
    totalCount > 0
      ? Math.round(((uploadedCount + failedCount) / totalCount) * 100)
      : 0;

  const fetchAlbum = useCallback(async () => {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      if (res.ok) {
        const data = await res.json();
        setAlbum(data);
        setName(data.name);
        setDescription(data.description || "");
        setCategory(data.category || "");
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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchAlbum(), fetchPhotos(), fetchCategories()]);
      setLoading(false);
    };
    load();
  }, [fetchAlbum, fetchPhotos, fetchCategories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category }),
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

  const uploadSingleFile = async (
    file: File,
    index: number
  ): Promise<void> => {
    const MAX_RETRIES = 3;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    setUploadFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
    );

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Step 1: Upload directly to Cloudinary from browser
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset || "");
        formData.append("folder", `dump/albums/${albumId}`);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!cloudinaryRes.ok) {
          const errData = await cloudinaryRes.json().catch(() => ({}));
          if (attempt === MAX_RETRIES) {
            setUploadFiles((prev) =>
              prev.map((f, i) =>
                i === index
                  ? { ...f, status: "failed", error: errData.error?.message || "Upload to Cloudinary failed" }
                  : f
              )
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        const cloudinaryData = await cloudinaryRes.json();
        const { secure_url, public_id, resource_type } = cloudinaryData;

        // Step 2: Save photo record to database via lightweight API route
        const saveRes = await fetch(`/api/albums/${albumId}/photos/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: secure_url,
            public_id: public_id,
            resource_type: resource_type,
          }),
        });

        if (saveRes.ok) {
          setUploadFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: "done" } : f))
          );
          return;
        } else {
          const data = await saveRes.json().catch(() => ({}));
          if (attempt === MAX_RETRIES) {
            setUploadFiles((prev) =>
              prev.map((f, i) =>
                i === index
                  ? { ...f, status: "failed", error: data.error || "Failed to save record" }
                  : f
              )
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      } catch {
        if (attempt === MAX_RETRIES) {
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: "failed", error: "Network error" }
                : f
            )
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMessage(null);
    setIsUploading(true);

    // Clean up any existing preview URLs before creating new ones
    uploadFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));

    // Initialize upload state for all files with preview URLs
    const fileStates: UploadFileState[] = Array.from(files).map((file) => ({
      file,
      status: "pending" as UploadFileStatus,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploadFiles(fileStates);

    // Process files with concurrency limit
    const fileArray = Array.from(files);
    let currentIndex = 0;

    const processNext = async (): Promise<void> => {
      while (currentIndex < fileArray.length) {
        const idx = currentIndex;
        currentIndex++;
        await uploadSingleFile(fileArray[idx], idx);
      }
    };

    // Start workers up to the concurrency limit
    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, fileArray.length) },
      () => processNext()
    );

    await Promise.all(workers);

    // Refresh photos after all uploads complete
    await fetchPhotos();
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDismissUploadProgress = () => {
    // Clean up object URLs to free memory
    uploadFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setUploadFiles([]);
  };

  const handleRetryFailed = async () => {
    // Get indices of failed files
    const failedIndices: number[] = [];
    setUploadFiles((prev) =>
      prev.map((f, i) => {
        if (f.status === "failed") {
          failedIndices.push(i);
          return { ...f, status: "pending" as UploadFileStatus, error: undefined };
        }
        return f;
      })
    );

    if (failedIndices.length === 0) return;

    setIsUploading(true);

    let currentIndex = 0;

    const processNext = async (): Promise<void> => {
      while (currentIndex < failedIndices.length) {
        const idx = currentIndex;
        currentIndex++;
        const fileIdx = failedIndices[idx];
        await uploadSingleFile(uploadFiles[fileIdx].file, fileIdx);
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, failedIndices.length) },
      () => processNext()
    );

    await Promise.all(workers);
    await fetchPhotos();
    setIsUploading(false);
  };

  const handleRetrySingle = async (index: number) => {
    setUploadFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "pending" as UploadFileStatus, error: undefined } : f
      )
    );

    setIsUploading(true);
    await uploadSingleFile(uploadFiles[index].file, index);
    await fetchPhotos();
    setIsUploading(false);
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
                htmlFor="category"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
              >
                <option value="">No category</option>
                {/* Preserve a previously-set value that is no longer in the list */}
                {category &&
                  !categories.some((cat) => cat.name === category) && (
                    <option value={category}>{category} (removed)</option>
                  )}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-gray-500 text-xs mt-2">
                  No categories yet.{" "}
                  <Link
                    href="/admin/categories"
                    className="text-red-400 hover:text-red-300"
                  >
                    Add categories
                  </Link>{" "}
                  to use them here.
                </p>
              )}
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
          <h2 className="text-xl font-bold text-white mb-4">Upload Media</h2>
          <div className="flex items-center gap-4">
            <label className="flex-1 relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleUpload}
                disabled={isUploading}
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
                    {isUploading
                      ? "Upload in progress..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Images (PNG, JPG, GIF, WebP) & videos (MP4, MOV, WebM) - supports 100+ files at once
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Upload Progress UI */}
          {uploadFiles.length > 0 && (
            <div className="mt-6 bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  {isUploading
                    ? `Uploading ${uploadedCount + failedCount} of ${totalCount} photos...`
                    : `Upload complete`}
                </h3>
                {!isUploading && (
                  <button
                    onClick={handleDismissUploadProgress}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor:
                      failedCount > 0 && !isUploading
                        ? "#f59e0b"
                        : "#ef4444",
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-xs">
                <span className="text-gray-400">
                  Total: <span className="text-white font-medium">{totalCount}</span>
                </span>
                <span className="text-green-400">
                  Success: <span className="font-medium">{uploadedCount}</span>
                </span>
                {failedCount > 0 && (
                  <span className="text-red-400">
                    Failed: <span className="font-medium">{failedCount}</span>
                  </span>
                )}
                {isUploading && (
                  <span className="text-blue-400">
                    In progress:{" "}
                    <span className="font-medium">
                      {uploadFiles.filter((f) => f.status === "uploading").length}
                    </span>
                  </span>
                )}
              </div>

              {/* Individual file list (scrollable for many files) */}
              {totalCount <= 50 && (
                <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
                  {uploadFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded text-xs"
                    >
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {item.file.name}
                      </span>
                      <span
                        className={`ml-2 flex-shrink-0 ${
                          item.status === "done"
                            ? "text-green-400"
                            : item.status === "failed"
                            ? "text-red-400"
                            : item.status === "uploading"
                            ? "text-blue-400"
                            : "text-gray-500"
                        }`}
                      >
                        {item.status === "done" && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {item.status === "failed" && (
                          <span title={item.error}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </span>
                        )}
                        {item.status === "uploading" && (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                        {item.status === "pending" && (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary for large batches */}
              {totalCount > 50 && failedCount > 0 && !isUploading && (
                <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
                  <p className="text-xs text-gray-400 mb-2">Failed files:</p>
                  {uploadFiles
                    .filter((f) => f.status === "failed")
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 rounded text-xs"
                      >
                        <span className="text-red-300 truncate max-w-[200px]">
                          {item.file.name}
                        </span>
                        <span className="text-red-400 ml-2">{item.error}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Failed Files Thumbnail Preview */}
              {failedCount > 0 && !isUploading && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Failed Uploads ({failedCount})
                    </h4>
                    <button
                      onClick={handleRetryFailed}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Retry All Failed
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
                    {uploadFiles
                      .map((item, idx) => ({ item, idx }))
                      .filter(({ item }) => item.status === "failed")
                      .map(({ item, idx }) => (
                        <div
                          key={idx}
                          className="relative group bg-gray-900 rounded-lg overflow-hidden border border-red-500/40"
                        >
                          <div className="aspect-square relative">
                            {item.file.type.startsWith("video/") ? (
                              <video
                                src={item.previewUrl}
                                muted
                                playsInline
                                className="w-full h-full object-cover opacity-70"
                              />
                            ) : (
                              <img
                                src={item.previewUrl}
                                alt={item.file.name}
                                className="w-full h-full object-cover opacity-70"
                              />
                            )}
                            <div className="absolute inset-0 bg-red-900/20" />
                            <div className="absolute top-1 right-1">
                              <svg className="w-5 h-5 text-red-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            {/* Retry single file button */}
                            <button
                              onClick={() => handleRetrySingle(idx)}
                              className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              title="Retry this file"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] text-gray-300 truncate" title={item.file.name}>
                              {item.file.name}
                            </p>
                            <p className="text-[10px] text-red-400 truncate" title={item.error}>
                              {item.error}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
                      {isVideo(photo.url, photo.media_type) ? (
                        <>
                          <img
                            src={getCloudinaryVideoThumbnail(photo.url, 400)}
                            alt={photo.caption || "Video"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 flex items-center justify-center bg-black/50 rounded-full">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.caption || "Photo"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {isCover && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-md">
                          Cover
                        </div>
                      )}
                      {/* Always-visible delete button */}
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                        title="Delete photo"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Hover overlay with Set as Cover button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 pointer-events-none">
                      {!isCover && (
                        <button
                          onClick={() => handleSetCover(photo.id)}
                          className="pointer-events-auto px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors"
                        >
                          Set as Cover
                        </button>
                      )}
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
