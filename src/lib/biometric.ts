// قفل التطبيق بالبصمة — طبقة حماية محلّية على الجهاز (WebAuthn platform).
//
// ملاحظة أمنية: هذا "قفل تطبيق" لا بديل لكلمة المرور. جلسة Supabase تبقى
// كما هي؛ البصمة تحمي *إعادة فتح* التطبيق على هذا الجهاز فقط. لا يوجد
// تحقّق خادمي للتوقيع (المسار أ)، فهو راحة/خصوصية لا عامل مصادقة خادمي.

const CRED_KEY = "aqarly_biocred"; // معرّف الاعتماد (base64url) على هذا الجهاز
const ENABLED_KEY = "aqarly_biolock"; // "1" عند التفعيل
const UNLOCK_KEY = "aqarly_biounlocked"; // علم فتح لكل جلسة تبويب

function bytesToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

// هل يدعم الجهاز مصادقة بصمة/وجه مدمجة؟
export async function biometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function biometricEnabled(): boolean {
  try {
    return (
      localStorage.getItem(ENABLED_KEY) === "1" &&
      !!localStorage.getItem(CRED_KEY)
    );
  } catch {
    return false;
  }
}

// تسجيل بصمة هذا الجهاز.
export async function enableBiometric(userName: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "عقارلي", id: window.location.hostname },
      user: {
        id: userId,
        name: userName || "user",
        displayName: userName || "مستخدم",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "discouraged",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("no-credential");
  localStorage.setItem(CRED_KEY, bytesToB64url(cred.rawId));
  localStorage.setItem(ENABLED_KEY, "1");
  markUnlocked();
}

export function disableBiometric(): void {
  try {
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(CRED_KEY);
  } catch {
    /* تجاهل */
  }
}

// التحقّق بالبصمة (يفتح قفل الجلسة).
export async function verifyBiometric(): Promise<boolean> {
  try {
    const id = localStorage.getItem(CRED_KEY);
    if (!id) return false;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { type: "public-key", id: b64urlToBytes(id) as BufferSource },
        ],
        userVerification: "required",
        rpId: window.location.hostname,
        timeout: 60000,
      },
    });
    if (assertion) {
      markUnlocked();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// هل يلزم فتح القفل الآن؟ (مفعّل ولم يُفتح في هذه الجلسة)
export function needsUnlock(): boolean {
  if (!biometricEnabled()) return false;
  try {
    return sessionStorage.getItem(UNLOCK_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    /* تجاهل */
  }
}
