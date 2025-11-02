import { headers } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"

const LocationWizard = dynamic(() => import("@/components/location-wizard"), { ssr: false })

type GeoData = {
  success: boolean
  message?: string
  city?: string
  region?: string
  country?: string
  latitude?: number
  longitude?: number
  postal?: string
  timezone?: string
}

function getClientIp(): string | undefined {
  const h = headers()
  // Prefer Vercel header, then standard proxies
  const candidates = [h.get("x-vercel-forwarded-for"), h.get("x-forwarded-for"), h.get("x-real-ip")].filter(
    Boolean,
  ) as string[]

  if (candidates.length === 0) return undefined
  // If multiple IPs (proxy chain), take the first
  return candidates[0].split(",")[0]?.trim()
}

function isPrivateOrReservedIp(ip: string): boolean {
  // IPv4 private, loopback, link-local
  if (/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(ip)) {
    return true
  }
  // Simple IPv6 checks: loopback ::1, unique local fc00::/7 (fc, fd), link-local fe80::
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true
  }
  return false
}

async function fetchGeo(): Promise<GeoData> {
  const ip = getClientIp()
  const base = "https://ipwho.is"

  // Only pass a public IP to the provider; otherwise let it infer
  const targetIp = ip && !isPrivateOrReservedIp(ip) ? ip : undefined
  const ipPath = targetIp ? `/${encodeURIComponent(targetIp)}` : "/"
  const fields = "fields=success,message,city,region,country,latitude,longitude,postal,timezone"
  const url = `${base}${ipPath}?${fields}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    const raw = await res.json()

    // ipwho.is may return timezone as a string or an object { id, abbr, ... }.
    const data: any = raw
    if (!data?.success) {
      return { success: false, message: data?.message || "Lookup failed" }
    }

    const tz =
      typeof data.timezone === "string"
        ? data.timezone
        : (data.timezone?.id ??
          data.timezone?.abbr ??
          (data.timezone ? JSON.stringify({ id: data.timezone.id, abbr: data.timezone.abbr }) : undefined))

    return {
      success: true,
      city: data.city ?? undefined,
      region: data.region ?? undefined,
      country: data.country ?? undefined,
      latitude: typeof data.latitude === "number" ? data.latitude : Number(data.latitude),
      longitude: typeof data.longitude === "number" ? data.longitude : Number(data.longitude),
      postal: data.postal != null ? String(data.postal) : undefined,
      timezone: tz,
    }
  } catch (e) {
    return { success: false, message: "Network error during geolocation" }
  }
}

export default async function Page() {
  const geo = await fetchGeo()

  return (
    <main className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Approximate Location (No GPS)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!geo.success ? (
            <p className="text-sm text-muted-foreground">{geo.message || "Could not determine location."}</p>
          ) : (
            <>
              <div>
                <div className="text-sm text-muted-foreground">Place</div>
                <div className="text-base">{[geo.city, geo.region, geo.country].filter(Boolean).join(", ")}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Latitude</div>
                  <div className="font-mono">{geo.latitude != null ? geo.latitude.toFixed(6) : "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Longitude</div>
                  <div className="font-mono">{geo.longitude != null ? geo.longitude.toFixed(6) : "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Postal</div>
                  <div>{geo.postal || "—"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time zone</div>
                  <div>{geo.timezone || "—"}</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Notes: This uses IP-based geolocation for coarse accuracy (often city/region level). No GPS or sensor
                data is accessed.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <LocationWizard
          initial={{
            success: geo.success,
            message: geo.message,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            latitude: geo.latitude,
            longitude: geo.longitude,
            postal: geo.postal,
            timezone: geo.timezone,
          }}
        />
      </div>
    </main>
  )
}
