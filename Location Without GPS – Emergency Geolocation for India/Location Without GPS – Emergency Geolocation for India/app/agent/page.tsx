"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Candidate = {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  plusCode: string
  score: number
}

type Payload = {
  center?: { lat: number; lng: number }
  city?: string | null
  country?: string | null
  candidates: Candidate[]
  note?: string | null
}

function base64UrlDecode(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
  const str = typeof window === "undefined" ? "" : window.atob(b64 + pad)
  try {
    // decodeURIComponent(escape(...)) keeps Unicode intact
    return JSON.parse(decodeURIComponent(escape(str)))
  } catch {
    return JSON.parse(str)
  }
}

export default function AgentPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const raw = params.get("data") || ""

  const payload: Payload | null = useMemo(() => {
    if (!raw) return null
    try {
      return base64UrlDecode(raw)
    } catch {
      return null
    }
  }, [raw])

  const [confirmed, setConfirmed] = useState<string | null>(null)

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-pretty">Agent Console</h1>
        <p className="text-muted-foreground">Review the caller’s candidate locations and confirm the best match.</p>
      </header>

      {!payload && <div className="text-sm">No data provided.</div>}

      {payload && (
        <>
          <Card className="p-4 space-y-1">
            <div className="text-sm">Reported area</div>
            <div className="text-lg font-medium">
              {[payload.city, payload.country].filter(Boolean).join(", ") || "Unknown"}
            </div>
            {payload.note && <div className="text-sm text-muted-foreground">Note: {payload.note}</div>}
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Candidates</h2>
            <div className="grid gap-3">
              {payload.candidates?.map((c) => (
                <Card
                  key={c.id}
                  className={`p-4 flex items-center justify-between ${confirmed === c.id ? "border-green-500" : ""}`}
                >
                  <div className="space-y-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.type} • {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                    </div>
                    <div className="text-sm">
                      Location Code: <span className="font-mono">{c.plusCode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Confidence {(c.score * 100).toFixed(0)}%</Badge>
                    <Button variant={confirmed === c.id ? "secondary" : "default"} onClick={() => setConfirmed(c.id)}>
                      {confirmed === c.id ? "Confirmed" : "Confirm"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
