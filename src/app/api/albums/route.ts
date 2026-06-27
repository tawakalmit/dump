import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import slugify from "@/lib/slugify";
import { requireAuth, getAdminScope } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { data: albums, error } = await supabase
    .from("albums")
    .select("*, photos(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restrict the list to the admin's category scope, if any.
  const scope = getAdminScope(request);
  const result =
    scope && albums
      ? albums.filter((album) => {
          const slug = album.category
            ? slugify(album.category)
            : "uncategorized";
          return slug === scope;
        })
      : albums;

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { name, description, category } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Album name is required" },
        { status: 400 }
      );
    }

    // Restricted admins can only create albums within their category scope.
    const scope = getAdminScope(request);
    const finalCategory = scope ? scope : category?.trim() || null;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;

    // Handle slug collisions by appending numeric suffix
    while (true) {
      const { data: existing } = await supabase
        .from("albums")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) break;

      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    const { data, error } = await supabase
      .from("albums")
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        category: finalCategory,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
