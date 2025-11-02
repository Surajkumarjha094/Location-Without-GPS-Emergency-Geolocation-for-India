export type GeoResult = {
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

export type Poi = {
  id: string
  name: string
  type: "school" | "hospital" | "metro" | "police" | "landmark"
  lat: number
  lng: number
  area?: string
}
