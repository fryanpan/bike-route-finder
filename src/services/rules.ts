// Type definitions for classification rules. The runtime API that served
// these (GET/PUT /api/rules/:region) was removed pre-launch because
// per-region rule customization wasn't useful in practice and the
// unauthenticated PUT was a DoS vector. Classification is now driven
// entirely by the hardcoded logic in src/utils/classify.ts +
// src/services/overpass.ts; these types remain only so `regionRules?`
// optional parameters in downstream modules stay well-typed even when
// the value is always undefined/empty.

export interface ClassificationRule {
  match: Record<string, string>
  classification: string
  travelModes: Record<string, 'preferred' | 'other'>
}

export interface RegionRules {
  rules: ClassificationRule[]
  legendItems: Array<{ name: string; icon: string; description: string }>
}
