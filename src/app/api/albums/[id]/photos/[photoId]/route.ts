import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const { photoId } = await params;

  // Get photo to find storage path
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", photoId)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 404 });
  }

  // Delete from storage
  if (photo.storage_path) {
    await supabase.storage.from("photos").remove([photo.storage_path]);
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
