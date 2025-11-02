"use client"

import { useMemo, useState, useEffect, useRef, useDeferredValue } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Fuse from "fuse.js"
import pois from "@/data/pois.json"
import type { Poi } from "@/lib/types"

type Result = { poi: Poi; score: number }

type Props = {
  hints?: string[]
  onResults: (results: Result[]) => void
}

export default function PoiSearch({ hints = [], onResults }: Props) {
  const [query, setQuery] = useState("")

  const fuse = useMemo(() => {
    return new Fuse(pois as Poi[], {
      keys: ["name", "type", "area"],
      threshold: 0.35,
      includeScore: true,
    })
  }, [])

  // Memoize hints to keep a stable reference across renders
  const allHints = useMemo(() => (hints || []).filter(Boolean), [hints])

  // Use a stable, minimal dependency key for hint-driven searches
  const hintKey = useMemo(() => allHints.slice(0, 3).join(" "), [allHints])

  // Debounce the query to avoid emitting on every keystroke
  const deferredQuery = useDeferredValue(query)

  // Compute results in a memo so reference is stable unless inputs truly change
  const results: Result[] = useMemo(() => {
    const primary = deferredQuery.trim()
    const searchText = primary || hintKey

    if (!searchText) return []

    const raw = fuse.search(searchText).map((r) => ({ poi: r.item as Poi, score: 1 - (r.score ?? 1) }))
    // Unique best matches by id
    const unique: Record<string, Result> = {}
    for (const r of raw) {
      const cur = unique[r.poi.id]
      if (!cur || r.score > cur.score) unique[r.poi.id] = r
    }
    return Object.values(unique)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [deferredQuery, hintKey, fuse])

  // Keep latest onResults in a ref so we don't depend on its identity
  const onResultsRef = useRef(onResults)
  useEffect(() => {
    onResultsRef.current = onResults
  }, [onResults])

  // Only emit when the result signature actually changes
  const signature = useMemo(() => results.map((r) => `${r.poi.id}:${Math.round(r.score * 1000)}`).join("|"), [results])
  const lastSigRef = useRef<string>("")
  useEffect(() => {
    // avoiding re-runs due to a new results array reference with identical content.
    if (signature !== lastSigRef.current) {
      lastSigRef.current = signature
      onResultsRef.current(results)
    }
  }, [signature])

  return (
    <Card className="p-4 space-y-3">
      <Label htmlFor="landmark">Nearest landmark (type a name)</Label>
      <Input
        id="landmark"
        placeholder="e.g., City General Hospital, Metro Gate A"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {allHints.length > 0 && (
        <>
          <Separator />
          <div className="text-sm">Detected from photo:</div>
          <div className="flex flex-wrap gap-2">
            {allHints.slice(0, 6).map((t, i) => (
              <Badge key={i} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
