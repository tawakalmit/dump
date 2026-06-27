import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { url, public_id, caption, resource_type } = body;

    if (!url || !public_id) {
      return NextResponse.json(
        { error: "url and public_id are required" },
        { status: 400 }
      );
    }

    // Derive media type from Cloudinary's resource_type, falling back to URL.
    const mediaType =
      resource_type === "video" || url.includes("/video/upload/")
        ? "video"
        : "image";

    const { data, error } = await supabase
      .from("photos")
      .insert({
        album_id: id,
        url,
        storage_path: public_id,
        media_type: mediaType,
        caption: caption?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save photo record" },
      { status: 500 }
    );
  }
}
