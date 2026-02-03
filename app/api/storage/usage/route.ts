import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdminClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const v = bytes / Math.pow(k, i)
  return `${v.toFixed(2)} ${sizes[i]}`
}

async function fetchSizesFromUrls(urls: string[]) {
  const sizes: number[] = []
  const batchSize = 8
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const promises = batch.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" })
        if (!res.ok) return 0
        const len = res.headers.get("content-length")
        if (!len) return 0
        const n = parseInt(len, 10)
        return Number.isFinite(n) ? n : 0
      } catch (err) {
        return 0
      }
    })
    const results = await Promise.all(promises)
    sizes.push(...results)
  }
  return sizes
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    const { data: rows, error } = await supabase.from("product_images").select("image_url,size")
    if (error) {
      console.error("Supabase error fetching product_images:", error)
      throw error
    }

    const items: Array<{ image_url: string; size?: number | null }> = (rows || []).map((r: any) => ({
      image_url: r.image_url,
      size: r.size ?? null,
    }))

    // sum sizes present in DB
    let usedBytes = 0
    const urlsToHead: string[] = []

    for (const it of items) {
      if (it.size && Number.isFinite(it.size) && it.size > 0) {
        usedBytes += Number(it.size)
      } else if (it.image_url) {
        urlsToHead.push(it.image_url)
      }
    }

    if (urlsToHead.length > 0) {
      const sizes = await fetchSizesFromUrls(urlsToHead)
      usedBytes += sizes.reduce((s, v) => s + (v || 0), 0)
    }

    // <-- capacidad ajustada a 1 GB (Supabase free bucket)
    const capacityBytes = 1 * 1024 * 1024 * 1024 // 1 GB
    const percent = Math.min(100, (usedBytes / capacityBytes) * 100)

    return NextResponse.json({
      usedBytes,
      capacityBytes,
      usedFormatted: formatBytes(usedBytes),
      capacityFormatted: formatBytes(capacityBytes),
      percent: Number(percent.toFixed(2)),
      filesCount: items.length,
    })
  } catch (err: any) {
    console.error("Storage usage error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
