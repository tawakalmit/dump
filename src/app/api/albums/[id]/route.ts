import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const updates: Record<string, string | null> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined)
      updates.description = body.description?.trim() || null;
    if (body.cover_photo_url !== undefined)
      updates.cover_photo_url = body.cover_photo_url;

    const { data, error } = await supabase
      .from("albums")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  // First get all photos to clean up from Cloudinary
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("album_id", id);

  // Delete files from Cloudinary
  if (photos && photos.length > 0) {
    const publicIds = photos
      .map((p) => p.storage_path)
      .filter(Boolean) as string[];
    if (publicIds.length > 0) {
      // Cloudinary supports up to 100 resources per delete call, so chunk if needed
      for (let i = 0; i < publicIds.length; i += 100) {
        const batch = publicIds.slice(i, i + 100);
        await cloudinary.api.delete_resources(batch);
      }
    }
  }

  // Delete album (cascade will delete photo records)
  const { error } = await supabase.from("albums").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
