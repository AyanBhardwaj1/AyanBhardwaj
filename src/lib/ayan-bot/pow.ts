import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Server-only proof-of-work tickets for ayan-bot.
 *
 * Every chat message must carry a fresh ticket: POST /api/ayan-bot/challenge
 * hands out `id.exp.bits.sig` (HMAC-signed, bound to a hash of the caller's
 * IP and user agent, valid for a few minutes). The browser then finds a nonce
 * so that sha256(`${ticket}:${nonce}`) starts with `bits` zero bits (about
 * 65k hashes at 16 bits: a blink for a person, real cost for a script sending
 * thousands). Each ticket works once.
 *
 * The signing key is AYAN_BOT_SECRET, or failing that one derived from the
 * OpenAI key (never sent anywhere), so tickets verify on every instance.
 */

export const TICKET_TTL_SEC = 300;

function secret(): Buffer {
  const s = process.env.AYAN_BOT_SECRET;
  if (s && s.length >= 16) return Buffer.from(s);
  const k = process.env.OPENAI_API_KEY;
  if (k) return createHmac("sha256", k).update("ayan-bot/pow/v1").digest();
  // Local dev with no key: a per-process secret is fine.
  return devSecret;
}
const devSecret = randomBytes(32);

const b64url = (b: Buffer) => b.toString("base64url");

/** A stable, salted, non-reversible client fingerprint (IP + user agent). */
export function clientKey(ip: string, ua: string): string {
  return b64url(
    createHmac("sha256", secret())
      .update(`client:${ip}|${ua.slice(0, 256)}`)
      .digest()
      .subarray(0, 12),
  );
}

function sign(payload: string) {
  return b64url(
    createHmac("sha256", secret()).update(payload).digest().subarray(0, 18),
  );
}

export function issueTicket(client: string, bits: number, now = Date.now()) {
  const id = b64url(randomBytes(12));
  const exp = Math.floor(now / 1000) + TICKET_TTL_SEC;
  const sig = sign(`${id}.${exp}.${bits}.${client}`);
  return { ticket: `${id}.${exp}.${bits}.${sig}`, bits, exp };
}

/** Leading zero bits of a digest. */
export function zeroBits(digest: Buffer): number {
  let n = 0;
  for (const byte of digest) {
    if (byte === 0) {
      n += 8;
      continue;
    }
    n += Math.clz32(byte) - 24;
    break;
  }
  return n;
}

export type TicketCheck =
  | { ok: true; id: string; exp: number }
  | { ok: false; reason: "malformed" | "expired" | "signature" | "work" };

/** Checks shape, signature, client binding, expiry and the work. Not replay. */
export function verifyTicket(
  ticket: unknown,
  nonce: unknown,
  client: string,
  minBits: number,
  now = Date.now(),
): TicketCheck {
  if (typeof ticket !== "string" || typeof nonce !== "string")
    return { ok: false, reason: "malformed" };
  if (ticket.length > 120 || nonce.length > 24 || !/^\d+$/.test(nonce))
    return { ok: false, reason: "malformed" };
  const parts = ticket.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };
  const [id, expS, bitsS, sig] = parts;
  const exp = Number(expS);
  const bits = Number(bitsS);
  if (!id || !Number.isInteger(exp) || !Number.isInteger(bits))
    return { ok: false, reason: "malformed" };
  const want = Buffer.from(sign(`${id}.${exp}.${bits}.${client}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got))
    return { ok: false, reason: "signature" };
  if (exp * 1000 < now) return { ok: false, reason: "expired" };
  if (bits < minBits) return { ok: false, reason: "work" };
  const digest = createHash("sha256").update(`${ticket}:${nonce}`).digest();
  if (zeroBits(digest) < bits) return { ok: false, reason: "work" };
  return { ok: true, id, exp };
}
