/**
 * Chat content policy for marketplace jobs.
 * - Phone numbers / emails / chat apps: ALWAYS blocked
 * - Full street addresses: blocked until escrow payment unlocks the thread
 * - Areas / landmarks / general locations: allowed
 */

const PHONE_PATTERNS: RegExp[] = [
  /(?:\+?234|0)\s*[789]\d[\s\-.]*\d{3}[\s\-.]*\d{4}/i,
  /(?:\+?\d{1,3}[\s\-.]*)?(?:\(?\d{2,4}\)?[\s\-.]*){2,4}\d{2,4}/,
  /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|oh)\b(?:\s+\b(?:zero|one|two|three|four|five|six|seven|eight|nine|oh)\b){6,}/i,
  /wa\.me\//i,
  /whats?app/i,
  /t\.me\//i,
];

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const HANDLE_PATTERNS: RegExp[] = [
  /(?:instagram|ig|facebook|fb|twitter|x\.com|tiktok)\s*[:/@]/i,
  /@[a-z0-9_]{3,}/i,
];

/** Heuristic: looks like a full address (street + number / estate plot). */
const ADDRESS_PATTERNS: RegExp[] = [
  /\bplot\s*\d+/i,
  /\b(?:no\.?|number)\s*\d{1,5}\b/i,
  /\b\d{1,5}\s+[a-z]+(?:\s+[a-z]+)?\s+(?:street|st\.?|road|rd\.?|avenue|ave\.?|close|crescent|drive|lane|way)\b/i,
  /\b(?:flat|apartment|apt\.?|suite|house)\s*\d+/i,
];

export type ChatFilterResult =
  | { ok: true }
  | { ok: false; reason: 'PHONE' | 'EMAIL' | 'HANDLE' | 'URL' | 'ADDRESS'; message: string };

function normalizeObfuscation(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xff10 + 0x30));
}

export function filterMarketplaceChat(
  body: string,
  opts: { addressUnlocked: boolean },
): ChatFilterResult {
  const text = normalizeObfuscation(body);

  if (EMAIL_PATTERN.test(text)) {
    return {
      ok: false,
      reason: 'EMAIL',
      message: 'Email addresses cannot be shared in chat. Use this system for all communication.',
    };
  }

  for (const re of PHONE_PATTERNS) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: 'PHONE',
        message:
          'Phone numbers and messaging-app contacts are blocked. Keep negotiation and payment inside Propa3.',
      };
    }
  }

  for (const re of HANDLE_PATTERNS) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: 'HANDLE',
        message: 'Social handles and off-platform contacts are not allowed in chat.',
      };
    }
  }

  if (/https?:\/\//i.test(text) || /\bwww\./i.test(text)) {
    return {
      ok: false,
      reason: 'URL',
      message: 'External links are blocked in job chat.',
    };
  }

  if (!opts.addressUnlocked) {
    for (const re of ADDRESS_PATTERNS) {
      if (re.test(text)) {
        return {
          ok: false,
          reason: 'ADDRESS',
          message:
            'Full addresses unlock only after the job/workmanship fee (or deposit) is paid into escrow. You may share area or landmark only for now.',
        };
      }
    }
  }

  return { ok: true };
}
