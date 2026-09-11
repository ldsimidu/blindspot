import { and, eq, gt, sql } from "drizzle-orm";
import { normalizeCatalogText } from "../catalog";
import type { SourceTrustBootstrapPolicy } from "../runtime-assets";
import type { SourceTrustCandidate } from "../source-trust";
import type { VehicleInput } from "../types";
import { getDatabase } from "./client";
import { sourceTrustAnchors } from "./schema";

export async function readLearnedSourceTrustAnchors(vehicle: VehicleInput): Promise<string[]> {
  const db = getDatabase();
  if (!db) return [];
  try {
    const rows = await db.select({ hostname: sourceTrustAnchors.hostname }).from(sourceTrustAnchors).where(and(
      eq(sourceTrustAnchors.brandNormalized, normalizeCatalogText(vehicle.marca)),
      eq(sourceTrustAnchors.marketNormalized, normalizeCatalogText(vehicle.mercado)),
      eq(sourceTrustAnchors.state, "learned"),
      gt(sourceTrustAnchors.expiresAt, new Date()),
    )).limit(3);
    return rows.map((row) => row.hostname);
  } catch {
    return [];
  }
}

export async function recordSourceTrustCandidates(vehicle: VehicleInput, candidates: SourceTrustCandidate[], policy: SourceTrustBootstrapPolicy): Promise<void> {
  const db = getDatabase();
  if (!db || candidates.length === 0) return;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + policy.bootstrap.expires_after_days * 24 * 60 * 60 * 1000);
  const brandNormalized = normalizeCatalogText(vehicle.marca);
  const marketNormalized = normalizeCatalogText(vehicle.mercado);
  try {
    for (const candidate of candidates) {
      const nextObservationCount = sql<number>`${sourceTrustAnchors.observationCount} + 1`;
      const nextConfidence = sql<number>`least(100, ${sourceTrustAnchors.confidence} + ${candidate.confidence})`;
      await db.insert(sourceTrustAnchors).values({
        brandNormalized,
        marketNormalized,
        hostname: candidate.hostname,
        state: "candidate",
        confidence: candidate.confidence,
        observationCount: 1,
        policyVersion: policy.version,
        firstObservedAt: now,
        lastObservedAt: now,
        expiresAt,
      }).onConflictDoUpdate({
        target: [sourceTrustAnchors.brandNormalized, sourceTrustAnchors.marketNormalized, sourceTrustAnchors.hostname],
        set: {
          confidence: nextConfidence,
          observationCount: nextObservationCount,
          state: sql`case when ${nextObservationCount} >= ${policy.bootstrap.minimum_observations_for_learned} and ${nextConfidence} >= ${policy.bootstrap.minimum_confidence_for_learned} then 'learned' else ${sourceTrustAnchors.state} end`,
          policyVersion: policy.version,
          lastObservedAt: now,
          expiresAt,
        },
      });
    }
  } catch {
    // Bootstrap learning must never prevent a technical-sheet response.
  }
}
