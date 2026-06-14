import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import slugify from "@/lib/slugify";

export async function GET() {
  const { data: albums, error } = await supabase
    .from("albums")
    .select("*, photos(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(albums);
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Album name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const { data, error } = await supabase
      .from("albums")
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
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
