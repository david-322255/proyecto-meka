// Smart Search & Fuzzy Recommendation Engine for Mekatron

/**
 * Normalizes string removing accents, lowercase and trimming
 */
export function normalize(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_.,/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standard Levenshtein distance calculation
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculates a match score from 0 to 100 between a target text and a search query.
 */
export function calculateMatchScore(rawTarget: string, rawQuery: string): number {
  const target = normalize(rawTarget);
  const query = normalize(rawQuery);

  if (!query || !target) return 0;
  if (target === query) return 100;

  // Exact word boundary or prefix match
  if (target.startsWith(query)) return 95;
  if (target.includes(` ${query}`) || target.endsWith(query)) return 90;
  if (target.includes(query)) return 85;

  const targetWords = target.split(" ").filter(Boolean);
  const queryWords = query.split(" ").filter(Boolean);

  // Check all query words present in target
  const allWordsMatched = queryWords.every((qw) =>
    targetWords.some((tw) => tw.startsWith(qw) || tw.includes(qw)),
  );
  if (allWordsMatched && queryWords.length > 0) return 80;

  // Word-level fuzzy comparison (closest word similarity)
  let bestWordScore = 0;
  for (const qw of queryWords) {
    for (const tw of targetWords) {
      if (tw.startsWith(qw)) {
        bestWordScore = Math.max(bestWordScore, 75);
      } else {
        const dist = levenshteinDistance(qw, tw);
        const maxLen = Math.max(qw.length, tw.length);
        if (maxLen > 0) {
          const ratio = (maxLen - dist) / maxLen;
          if (dist <= 1 && qw.length >= 3) {
            bestWordScore = Math.max(bestWordScore, 70);
          } else if (dist <= 2 && qw.length >= 4) {
            bestWordScore = Math.max(bestWordScore, 58);
          } else if (ratio >= 0.65) {
            bestWordScore = Math.max(bestWordScore, Math.round(ratio * 70));
          }
        }
      }
    }
  }

  // Full-string distance score
  const fullDist = levenshteinDistance(query, target);
  const fullMax = Math.max(query.length, target.length);
  const fullRatio = fullMax > 0 ? (fullMax - fullDist) / fullMax : 0;
  const fullScore = Math.round(fullRatio * 60);

  return Math.max(bestWordScore, fullScore);
}

export interface SearchMatch<T> {
  item: T;
  score: number;
  isExact: boolean;
  isRecommendation: boolean;
}

/**
 * Searches a list of items and returns matches sorted by similarity.
 * Automatically identifies closest recommendations when exact matches are not found.
 */
export function searchCollection<T>(
  items: T[],
  query: string,
  extractFields: (item: T) => string[],
  minThreshold = 35,
): {
  matches: SearchMatch<T>[];
  closestRecommendation: SearchMatch<T> | null;
} {
  const cleanQ = query.trim();
  if (!cleanQ) {
    return {
      matches: items.map((item) => ({
        item,
        score: 100,
        isExact: true,
        isRecommendation: false,
      })),
      closestRecommendation: null,
    };
  }

  const scored: SearchMatch<T>[] = [];

  for (const item of items) {
    const fields = extractFields(item);
    let maxScore = 0;
    for (const field of fields) {
      const score = calculateMatchScore(field, cleanQ);
      if (score > maxScore) {
        maxScore = score;
      }
    }

    if (maxScore >= minThreshold) {
      scored.push({
        item,
        score: maxScore,
        isExact: maxScore >= 80,
        isRecommendation: maxScore < 80,
      });
    }
  }

  // Sort by highest score first
  scored.sort((a, b) => b.score - a.score);

  const hasExact = scored.some((s) => s.isExact);
  const closestRecommendation = !hasExact && scored.length > 0 ? scored[0] : null;

  return {
    matches: scored,
    closestRecommendation,
  };
}
