"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = typeof window !== "undefined" && window.localStorage.getItem("consent-v1")
    if (!seen) setVisible(true)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-lg bg-background border rounded-lg p-4 shadow-md">
      <div className="text-sm">
        This app estimates your location without GPS using your network information and the hints you provide. Photos
        are processed locally. We do not store your raw IP.
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setVisible(false)}>
          Dismiss
        </Button>
        <Button
          onClick={() => {
            window.localStorage.setItem("consent-v1", "true")
            setVisible(false)
          }}
        >
          I Agree
        </Button>
      </div>
    </div>
  )
}
