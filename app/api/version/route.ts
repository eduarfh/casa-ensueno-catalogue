// app/api/version/route.ts (Next server route)
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return NextResponse.json({ name: pkg.name, version: pkg.version });
  } catch (err) {
    return NextResponse.json({ error: "Cannot read package.json" }, { status: 500 });
  }
}
