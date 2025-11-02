"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import PoiSearch from "@/components/poi-search"
import UploadOCR from "@/components/upload-ocr"
import ConsentBanner from "@/components/consent-banner"
import type { GeoResult, Poi } from "@/lib/types"
import { encodePlusCode } from "@/lib/pluscode"

type Props = {
  initial: GeoResult
}

type Candidate = {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  plusCode: string
  score: number
}

function base64UrlEncode(obj: any) {
  const json = JSON.stringify(obj)
  const b64 = typeof window !== "undefined" ? window.btoa(unescape(encodeURIComponent(json))) : ""
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export default function LocationWizard({ initial }: Props) {
  const [ocrHints, setOcrHints] = useState<string[]>([])
  const [note, setNote] = useState<string>("")
  const [results, setResults] = useState<{ poi: Poi; score: number }[]>([])
  const [link, setLink] = useState<string | null>(null)

  const initialPlusCode = useMemo(() => {
    if (typeof initial.latitude === "number" && typeof initial.longitude === "number") {
      return encodePlusCode(initial.latitude, initial.longitude, 10)
    }
    return null
  }, [initial.latitude, initial.longitude])

  const candidates: Candidate[] = useMemo(
    () =>
      results.slice(0, 3).map(({ poi, score }) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        lat: poi.lat,
        lng: poi.lng,
        plusCode: encodePlusCode(poi.lat, poi.lng, 10),
        score,
      })),
    [results],
  )

  function makeAgentLink() {
    const payload = {
      center:
        typeof initial.latitude === "number" && typeof initial.longitude === "number"
          ? { lat: initial.latitude, lng: initial.longitude }
          : undefined,
      city: initial.city ?? null,
      country: initial.country ?? null,
      candidates,
      note: note || null,
    }
    const encoded = base64UrlEncode(payload)
    const href =
      typeof window !== "undefined" ? `${window.location.origin}/agent?data=${encoded}` : `/agent?data=${encoded}`
    setLink(href)
    return href
  }

  async function copyLink() {
    const href = link || makeAgentLink()
    try {
      await navigator.clipboard.writeText(href)
      alert("Agent link copied to clipboard.")
    } catch {
      // no-op
    }
  }

  return (
    <>
      <ConsentBanner />
      <section className="space-y-4">
        <Card className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground">Detected area</div>
          <div className="text-base">
            {[initial.city, initial.region, initial.country].filter(Boolean).join(", ") || "Unknown"}
          </div>
          <div className="text-sm">
            {typeof initial.latitude === "number" && typeof initial.longitude === "number" ? (
              <>
                Lat/Lng{" "}
                <span className="font-mono">
                  {initial.latitude.toFixed(6)}, {initial.longitude.toFixed(6)}
                </span>
              </>
            ) : (
              "Coordinates unavailable"
            )}
          </div>
          {initialPlusCode && (
            <div className="text-sm">
              Plus Code: <span className="font-mono">{initialPlusCode}</span>
            </div>
          )}
        </Card>

        <UploadOCR onExtract={setOcrHints} />

        <PoiSearch hints={ocrHints} onResults={setResults} />

        {candidates.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="text-sm">Top candidates</div>
            <div className="grid gap-2">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.type} • {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                    </div>
                    <div className="text-sm">
                      Location Code: <span className="font-mono">{c.plusCode}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">Confidence {(c.score * 100).toFixed(0)}%</Badge>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Optional note for agent</Label>
              <Input
                id="note"
                placeholder="e.g., Near Gate A, opposite Town Hall"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={makeAgentLink}>Generate Agent Link</Button>
              <Button variant="outline" onClick={copyLink}>
                Copy Link
              </Button>
            </div>
            {link && (
              <div className="text-sm break-all">
                Link:{" "}
                <a className="text-primary underline" href={link}>
                  {link}
                </a>
              </div>
            )}
          </Card>
        )}
      </section>
    </>
  )
}
