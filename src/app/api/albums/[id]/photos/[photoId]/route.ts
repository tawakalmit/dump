import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { photoId } = await params;

  // Get photo to find Cloudinary public_id (stored in storage_path)
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("storage_path, media_type, url")
    .eq("id", photoId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  // Delete from Cloudinary (videos require resource_type: "video")
  if (photo.storage_path) {
    const resourceType =
      photo.media_type === "video" || photo.url?.includes("/video/upload/")
        ? "video"
        : "image";
    await cloudinary.uploader.destroy(photo.storage_path, {
      resource_type: resourceType,
    });
  }

  // Delete record
  const { error } = await supabase.from("photos").delete().eq("id", photoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id, photoId } = await params;

  // Get photo URL
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("url")
    .eq("id", photoId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  // Update album cover
  const { data, error } = await supabase
    .from("albums")
    .update({ cover_photo_url: photo.url })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
