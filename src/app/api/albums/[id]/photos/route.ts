import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, isCategoryAllowed } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const { id } = await params;

  // Enforce category scope for restricted admins.
  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("category")
    .eq("id", id)
    .single();

  if (albumError) {
    return NextResponse.json({ error: albumError.message }, { status: 404 });
  }

  if (!isCategoryAllowed(request, album.category)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum of 100MB" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, MP4, MOV, WebM, AVI, MKV",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary (auto detects image vs video)
    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dump/albums/${id}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(
              result as {
                secure_url: string;
                public_id: string;
                resource_type: string;
              }
            );
          }
        }
      );
      uploadStream.end(buffer);
    });

    const mediaType =
      uploadResult.resource_type === "video" ? "video" : "image";

    // Insert photo record with Cloudinary URL
    const { data, error } = await supabase
      .from("photos")
      .insert({
        album_id: id,
        url: uploadResult.secure_url,
        storage_path: uploadResult.public_id,
        media_type: mediaType,
        caption: caption?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file from Cloudinary if record creation fails
      await cloudinary.uploader.destroy(uploadResult.public_id, {
        resource_type: uploadResult.resource_type,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
