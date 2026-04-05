/** Audit service — stub for type exports (full implementation in parallel task) */

export interface SegmentTally {
  great: number;
  good: number;
  ok: number;
  acceptable: number;
  avoid: number;
  unclassified: number;
}

export interface CityScan {
  city: string;
  scannedAt: string;
  totalKm: number;
  segments: SegmentTally;
}
