// Shared domain types

export interface LatLng {
  lat: number
  lng: number
}

export interface Place extends LatLng {
  label: string
  shortLabel: string
}

export type BicycleType = 'Hybrid' | 'Road' | 'Cross' | 'Mountain'

export interface BicycleCostingOptions {
  bicycle_type: BicycleType
  cycling_speed: number
  use_roads: number
  avoid_bad_surfaces: number
  use_hills: number
  use_ferry: number
  use_living_streets?: number
}

export interface RiderProfile {
  label: string
  emoji: string
  description: string
  costingOptions: BicycleCostingOptions
  editable: boolean
}

export type ProfileKey = string

export type ProfileMap = Record<ProfileKey, RiderProfile>

export type SafetyClass = 'great' | 'good' | 'ok' | 'acceptable' | 'caution' | 'avoid'

export interface SafetyInfo {
  label: string
  color: string
  icon: string
  textColor: string
}

/**
 * Edge attributes returned by Valhalla trace_attributes.
 *
 * edge.use values (key ones):
 *   0  = road, 18 = living_street, 20 = cycleway, 21 = mountain_bike, 25 = path
 *
 * edge.cycle_lane:
 *   0 = none, 1 = shared (sharrow), 2 = dedicated (painted), 3 = separated, 4 = share_busway
 *
 * edge.road_class:
 *   0 = motorway … 4 = tertiary, 5 = unclassified, 6 = residential, 7 = service
 *
 * edge.bicycle_network:
 *   0 = none, 1 = national, 2 = regional, 4 = local, 8 = mountain
 *   NOTE: This tracks cycling route networks (NCN/RCN/LCN), NOT bicycle_road=yes.
 *
 * edge.bicycle_road:
 *   true if the OSM way has bicycle_road=yes (Fahrradstrasse in Germany)
 */
export interface ValhallaEdge {
  use?: number
  cycle_lane?: number
  road_class?: number
  bicycle_network?: number
  /** True for Fahrradstrasse (OSM: bicycle_road=yes) */
  bicycle_road?: boolean
  surface?: string
}

export interface RouteSegment {
  safetyClass: SafetyClass
  coordinates: [number, number][]
}

export interface ValhallaManeuver {
  type: number
  instruction: string
  length: number
  time: number
}

export interface Route {
  coordinates: [number, number][]
  maneuvers: ValhallaManeuver[]
  summary: {
    distance: number // km
    duration: number // seconds
  }
  segments?: RouteSegment[]
}

export interface OsmWay {
  safetyClass: SafetyClass
  coordinates: [number, number][]
  osmId: number
  tags: Record<string, string>
}
