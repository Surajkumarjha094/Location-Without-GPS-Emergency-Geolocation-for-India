"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Props = {
  onExtract: (text: string[]) => void
}

export default function UploadOCR({ onExtract }: Props) {
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)

    let imageURL: string | null = null
    try {
      // dynamic import on client; use default export for recognize()
      const { default: Tesseract } = await import("tesseract.js")

      imageURL = URL.createObjectURL(file)
      const { data } = await Tesseract.recognize(imageURL, "eng")
      // revoke immediately after use
      URL.revokeObjectURL(imageURL)
      imageURL = null

      const raw = data?.text || ""
      const found = raw
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20)

      setLines(found)
      onExtract(found)
    } catch (e: any) {
      setError(e?.message || "OCR failed")
    } finally {
      if (imageURL) URL.revokeObjectURL(imageURL)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="photo">Optional photo (shopboard/road sign)</Label>
      <Input
        id="photo"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <div className="text-sm text-muted-foreground">Processed on-device. Photo is not uploaded to a server.</div>
      {loading && <div className="text-sm">Extracting text…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {lines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lines.slice(0, 8).map((t, i) => (
            <Badge key={i} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" disabled={loading} onClick={() => onExtract(lines)}>
        Use extracted text
      </Button>
    </div>
  )
}
