import type { AnalyzedComment } from './types';

interface RawComment {
  id: string;
  author: string;
  authorChannelId?: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  isReply: boolean;
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function scoreComments(rawComments: RawComment[]): AnalyzedComment[] {
  return rawComments.map((comment, idx) => {
    let score = 0;
    const signals: string[] = [];

    // 1. Exact duplicate detection (highest weight)
    const exactDups = rawComments.filter((c, i) => i !== idx && c.text.trim() === comment.text.trim()).length;
    if (exactDups > 0) {
      score += Math.min(50, exactDups * 18);
      signals.push(`Exact duplicate of ${exactDups} other comment${exactDups > 1 ? 's' : ''}`);
    }

    // 2. Near-duplicate detection (Jaccard similarity > 0.75)
    if (exactDups === 0) {
      const nearDups = rawComments.filter((c, i) => {
        if (i === idx) return false;
        return jaccardSimilarity(c.text, comment.text) > 0.75;
      }).length;
      if (nearDups > 0) {
        score += Math.min(35, nearDups * 12);
        signals.push(`Near-identical to ${nearDups} other comment${nearDups > 1 ? 's' : ''}`);
      }
    }

    // 3. Generic/bot username patterns
    const usernamePatterns = [
      /^[A-Za-z]+\d{5,}$/, // letters followed by 5+ numbers
      /^\w+_\d{4,}$/, // word_1234
      /^[A-Z][a-z]+\s[A-Z][a-z]+\d{3,}$/, // FirstName LastName123
      /^user\d+$/i, // user12345
      /^[a-z]{3,8}\d{4,8}$/, // abc12345
    ];
    if (usernamePatterns.some(p => p.test(comment.author))) {
      score += 15;
      signals.push('Auto-generated username pattern detected');
    }

    // 4. Promotional language
    const promoPatterns = [
      /check out my channel/i,
      /subscribe to my/i,
      /visit my (channel|profile|page)/i,
      /click (the |my )?link/i,
      /follow me/i,
      /sub for sub/i,
      /like and subscribe/i,
    ];
    const promoHits = promoPatterns.filter(p => p.test(comment.text)).length;
    if (promoHits > 0) {
      score += promoHits * 12;
      signals.push('Promotional self-advertising language');
    }

    // 5. Contains URLs
    if (/https?:\/\/\S+|www\.\S+/i.test(comment.text)) {
      score += 18;
      signals.push('Contains external URL');
    }

    // 6. Very short generic comment
    const wordCount = comment.text.trim().split(/\s+/).length;
    const genericShort = [
      /^(great|nice|good|amazing|awesome|wonderful|excellent|perfect|love this|love it|so good|so great)[\s!.]*$/i,
      /^(first|second|third)[\s!.]*$/i,
      /^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\s]+$/u,
    ];
    if (genericShort.some(p => p.test(comment.text.trim()))) {
      score += 15;
      signals.push('Generic low-effort comment');
    }

    // 7. High emoji density
    const emojiMatches = comment.text.match(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
    if (wordCount > 0 && emojiMatches.length / wordCount > 0.6) {
      score += 12;
      signals.push('Unusually high emoji density');
    }

    // 8. All caps (excluding short exclamations)
    if (comment.text.length > 15) {
      const letters = comment.text.replace(/[^a-zA-Z]/g, '');
      const capsRatio = (letters.match(/[A-Z]/g) || []).length / Math.max(letters.length, 1);
      if (capsRatio > 0.65) {
        score += 10;
        signals.push('Excessive capitalization');
      }
    }

    // 9. Repetitive punctuation
    if (/[!?]{4,}/.test(comment.text) || /\.{5,}/.test(comment.text)) {
      score += 8;
      signals.push('Repetitive punctuation pattern');
    }

    const finalScore = Math.min(100, score);
    const classification: AnalyzedComment['classification'] =
      finalScore >= 60 ? 'bot' : finalScore >= 30 ? 'suspicious' : 'human';

    return {
      ...comment,
      botScore: finalScore,
      classification,
      signals,
    };
  });
}

export function detectClusters(comments: AnalyzedComment[]) {
  // Group near-duplicate comments into clusters
  const visited = new Set<number>();
  const clusters: Array<{ indices: number[]; sampleText: string }> = [];

  for (let i = 0; i < comments.length; i++) {
    if (visited.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < comments.length; j++) {
      if (visited.has(j)) continue;
      if (jaccardSimilarity(comments[i].text, comments[j].text) > 0.6) {
        group.push(j);
        visited.add(j);
      }
    }
    visited.add(i);
    if (group.length >= 3) {
      clusters.push({ indices: group, sampleText: comments[i].text });
    }
  }

  return clusters.map((cluster, idx) => ({
    id: `cluster-${idx}`,
    narrative: cluster.sampleText.slice(0, 120) + (cluster.sampleText.length > 120 ? '...' : ''),
    commentCount: cluster.indices.length,
    confidence: Math.min(0.99, 0.5 + cluster.indices.length * 0.05),
    sampleComments: cluster.indices.slice(0, 3).map(i => comments[i].text),
  }));
}
