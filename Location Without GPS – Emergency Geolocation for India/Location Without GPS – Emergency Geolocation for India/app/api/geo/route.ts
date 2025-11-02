export async function GET(req: Request) {
  const getClientIp = () => {
    const xv = req.headers.get("x-vercel-forwarded-for") || ""
    const xf = req.headers.get("x-forwarded-for") || ""
    const xr = req.headers.get("x-real-ip") || ""
    const first = (xv || xf).split(",")[0]?.trim()
    return first || xr || ""
  }

  const isPrivateIp = (ip: string) => {
    return (
      /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip) ||
      ip === "::1" ||
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      ip.startsWith("fe80")
    )
  }

  const ip = getClientIp()
  const ipParam = ip && !isPrivateIp(ip) ? ip : undefined

  // Using ipapi.co (no key needed, but rate-limited). Substitute your preferred provider if needed.
  const url = ipParam ? `https://ipapi.co/${encodeURIComponent(ipParam)}/json/` : "https://ipapi.co/json/"

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "GeoIP lookup failed" }), { status: 502 })
    }
    const data = await res.json()

    // Normalize the shape we return to the client (do not expose raw IP)
    const payload = {
      city: data.city ?? null,
      region: data.region ?? data.region_code ?? null,
      country: data.country_name ?? data.country ?? null,
      latitude: typeof data.latitude === "number" ? data.latitude : Number(data.latitude) || null,
      longitude: typeof data.longitude === "number" ? data.longitude : Number(data.longitude) || null,
      postal: data.postal ?? null,
      timezone: data.timezone ?? null,
      accuracy: "coarse-ip",
      provider: "ipapi.co",
    }

    return new Response(JSON.stringify(payload), {
      headers: { "content-type": "application/json" },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "GeoIP service unreachable" }), { status: 502 })
  }
}
