"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    setMessage(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        setName("");
        setMessage({ type: "success", text: "Category added" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to add category" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setMessage({ type: "success", text: "Category deleted" });
      } else {
        setMessage({ type: "error", text: "Failed to delete category" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred" });
    }
  };

  return (
    <main className="flex-1">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Categories</h1>

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

          <form onSubmit={handleAdd} className="flex gap-3 mb-8">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
            />
            <button
              type="submit"
              disabled={adding || !name.trim()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </form>

          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No categories yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Add a category to use it when creating albums.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-white">{category.name}</span>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg border border-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
