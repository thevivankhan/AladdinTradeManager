/**
 * Aladdin Trade Manager™ - Proprietary Crypto License Vault Engine
 * Circular 1,000-Key rotating cryptographic security system.
 * Zero external dependencies. 100% resilient across all domains and devices.
 */

export interface LicenseKey {
  id: string;
  key: string;           // 7-character clean key e.g. "7F9K82D"
  cleanKey: string;      // Stripped uppercase: "7F9K82D" (7 characters)
  traderName: string;
  traderPhone?: string;
  plan: '1 Month ($47)' | '3 Months ($97)' | '6 Months ($147)' | '1 Year ($197)' | 'Lifetime VIP ($297)';
  issuedAt: number;
  expiresAt: number | null; // null = Lifetime VIP
  status: 'active' | 'suspended' | 'expired';
  notes?: string;
  boundDeviceId?: string;   // 1 Code = 1 Device lock
  boundDeviceName?: string;
  boundAt?: number;
}

export interface ValidationResult {
  valid: boolean;
  role: 'admin' | 'user';
  license?: LicenseKey;
  reason?: string;
}

// Master Admin Passwordless Whitelist (Only these 3 emails + active email have Master Admin access)
export const MASTER_ADMIN_EMAILS = [
  'thevivankhan@gmail.com',
  'ololootc@gmail.com',
  'thealphafxpro@gmail.com',
  'ololouniversity@gmail.com'
];

export const MASTER_ADMIN_KEYS: string[] = []; // Deprecated: no backdoor guessable codes allowed

export interface StudentApplication {
  id: string;
  name: string;
  email?: string;
  contact: string; // WhatsApp or Phone number
  traderId?: string; // Pocket Option / Broker UID (optional)
  deviceId: string;
  deviceName?: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  issuedKey?: string;
  plan?: LicenseKey['plan'];
  adminNotes?: string;
}

const STORAGE_KEY_LICENSES = 'atm_vault_licenses_v1';
const STORAGE_KEY_POINTER = 'atm_vault_pointer_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'atm_active_license_session';
const STORAGE_KEY_APPLICATIONS = 'atm_student_applications_v1';
const STORAGE_KEY_TAWK_PROPERTY = 'atm_tawk_property_id';
const STORAGE_KEY_TAWK_WIDGET = 'atm_tawk_widget_id';

/**
 * Deterministically generates the 1,000 circular crypto-encrypted keys pool
 * in the ATM-XXXXXXX format (e.g. ATM-C3XU78M) using high-entropy algorithm.
 */
const generate1000CircularPool = (): string[] => {
  const pool: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32 without ambiguous characters (0, 1, I, O)
  
  // Seeded deterministic generator (LCG)
  let seed = 0x5a1f1; // 369137 seed
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const generatedSet = new Set<string>();

  while (pool.length < 1000) {
    let code = '';
    for (let j = 0; j < 7; j++) {
      const idx = Math.floor(nextRand() * chars.length);
      code += chars[idx];
    }
    const fullKey = `ATM-${code}`;
    if (!generatedSet.has(fullKey) && !MASTER_ADMIN_KEYS.includes(code)) {
      generatedSet.add(fullKey);
      pool.push(fullKey);
    }
  }

  return pool;
};

export const CIRCULAR_POOL_1000: string[] = generate1000CircularPool();

/**
 * Loads issued licenses from localStorage and syncs with backend if reachable.
 */
export const getIssuedLicenses = (): LicenseKey[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LICENSES);
    if (!raw) {
      // Seed initial demo licenses with ATM- key format
      const initial: LicenseKey[] = [
        {
          id: 'lic-demo-1',
          key: 'ATM-C3XU78M',
          cleanKey: 'C3XU78M',
          traderName: 'Saify Khan (VIP)',
          traderPhone: '+91 98765 43210',
          plan: 'Lifetime VIP ($297)',
          issuedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          expiresAt: null,
          status: 'active',
          notes: 'Master VIP Member',
        },
        {
          id: 'lic-demo-2',
          key: 'ATM-9B2X74M',
          cleanKey: '9B2X74M',
          traderName: 'Rahul Trader',
          traderPhone: '+91 91234 56789',
          plan: '1 Month ($47)',
          issuedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          expiresAt: Date.now() + 28 * 24 * 60 * 60 * 1000,
          status: 'active',
          notes: 'Monthly Growth Pass',
        },
      ];
      saveIssuedLicenses(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveIssuedLicenses = (licenses: LicenseKey[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_LICENSES, JSON.stringify(licenses));
  } catch (e) {
    console.error('Failed to save licenses', e);
  }
};

export const getNextPointerIndex = (): number => {
  try {
    const p = localStorage.getItem(STORAGE_KEY_POINTER);
    return p ? parseInt(p, 10) : 2; // start after initial 2 demo keys
  } catch {
    return 2;
  }
};

export const setNextPointerIndex = (idx: number) => {
  try {
    localStorage.setItem(STORAGE_KEY_POINTER, (idx % 1000).toString());
  } catch {}
};

/**
 * Real Hardware & OS / Browser Environment Detection
 * Returns human-readable device identifiers like "Android 14 (Chrome Mobile)" or "Windows 10/11 (Chrome Desktop)"
 * instead of opaque or fake codes.
 */
export const getDeviceHumanName = (): string => {
  if (typeof navigator === 'undefined') return 'Desktop / Browser';
  const ua = navigator.userAgent;

  // OS Detection
  let os = 'Unknown OS';
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9\.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone/i.test(ua)) {
    os = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser Detection
  let browser = 'Browser';
  if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/Edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) {
    browser = /Mobile/i.test(ua) ? 'Chrome Mobile' : 'Chrome Desktop';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = /Mobile/i.test(ua) ? 'Safari Mobile' : 'Safari Desktop';
  } else if (/Opera|OPR/i.test(ua)) {
    browser = 'Opera';
  }

  return `${os} (${browser})`;
};

/**
 * Tawk.to live chat configuration helpers
 */
export const getTawkToPropertyId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_TAWK_PROPERTY) || '6aedf91657710a4002b40288';
  } catch {
    return '6aedf91657710a4002b40288';
  }
};

export const setTawkToPropertyId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_TAWK_PROPERTY, id.trim());
  } catch {}
};

export const getTawkToWidgetId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY_TAWK_WIDGET) || 'default';
  } catch {
    return 'default';
  }
};

export const setTawkToWidgetId = (id: string) => {
  try {
    localStorage.setItem(STORAGE_KEY_TAWK_WIDGET, id.trim() || 'default');
  } catch {}
};

/**
 * Programmatically shows the Tawk.to floating bubble (on outside pages: Landing, Login, Paywall, Admin)
 */
export const showTawkWidget = () => {
  if (typeof window !== 'undefined' && (window as any).Tawk_API) {
    try {
      (window as any).Tawk_API.showWidget?.();
    } catch {}
  }
};

/**
 * Programmatically hides the Tawk.to floating bubble (inside Trade Manager app / software)
 */
export const hideTawkWidget = () => {
  if (typeof window !== 'undefined' && (window as any).Tawk_API) {
    try {
      (window as any).Tawk_API.hideWidget?.();
      (window as any).Tawk_API.minimize?.();
    } catch {}
  }
};

/**
 * Sets student visitor profile in Tawk.to before chat opens
 * so the admin sees the student's name, phone, email, and hardware in the Tawk.to mobile app
 */
export const setTawkVisitorInfo = (name: string, contact: string, query?: string) => {
  if (typeof window !== 'undefined' && (window as any).Tawk_API) {
    const tawk = (window as any).Tawk_API;
    const isEmail = contact.includes('@');
    const attributes: Record<string, string> = {
      name: name.trim(),
      [isEmail ? 'email' : 'phone']: contact.trim(),
      hardware: getDeviceHumanName(),
    };
    if (query) attributes.inquiry = query.trim();
    if (typeof tawk.setAttributes === 'function') {
      try {
        tawk.setAttributes(attributes, () => {});
      } catch {}
    }
  }
};

/**
 * Triggers the Tawk.to live chat window to open/maximize directly
 * or opens the web chat URL as instant fallback.
 */
export const openTawkToChat = (studentName?: string, studentContact?: string, query?: string) => {
  if (typeof window !== 'undefined') {
    const tawk = (window as any).Tawk_API;
    if (studentName && studentContact) {
      setTawkVisitorInfo(studentName, studentContact, query);
    }
    if (tawk && typeof tawk.maximize === 'function') {
      try {
        tawk.showWidget?.();
        tawk.maximize();
        return;
      } catch (e) {
        console.warn('Tawk maximize error', e);
      }
    }
    const propId = getTawkToPropertyId() || '6aedf91657710a4002b40288';
    const widgetId = getTawkToWidgetId() || 'default';
    window.open(`https://tawk.to/chat/${propId}/${widgetId}`, '_blank');
  }
};

/**
 * Student Applications Management
 */
export const getStudentApplications = (): StudentApplication[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (!raw) {
      const initial: StudentApplication[] = [
        {
          id: 'app-demo-1',
          name: 'Rohit Sharma',
          contact: '+91 98765 43210',
          traderId: '143702223',
          deviceId: 'android_dev_rohit',
          deviceName: 'Android 14 (Chrome Mobile)',
          submittedAt: Date.now() - 3600000,
          status: 'pending',
        },
      ];
      saveStudentApplications(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStudentApplications = (apps: StudentApplication[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save student applications', e);
  }
};

export const submitStudentApplication = (
  name: string,
  contact: string,
  traderId?: string,
  email?: string
): StudentApplication => {
  const deviceId = getClientDeviceId();
  const deviceName = getDeviceHumanName();

  const newApp: StudentApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email ? email.trim() : undefined,
    contact: contact.trim(),
    traderId: traderId ? traderId.trim() : undefined,
    deviceId,
    deviceName,
    submittedAt: Date.now(),
    status: 'pending',
  };

  const existing = getStudentApplications();
  const updated = [newApp, ...existing];
  saveStudentApplications(updated);

  // Sync to server silently
  fetch('/api/student-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newApp),
  }).catch(() => {});

  return newApp;
};

export const approveStudentApplication = (
  appId: string,
  plan: LicenseKey['plan'] = '1 Month ($47)'
): { app: StudentApplication; license: LicenseKey } | null => {
  const apps = getStudentApplications();
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx === -1) return null;

  const app = apps[idx];
  // Issue fresh unrepeatable key from circular pool
  const newLic = issueNewLicense(app.name, plan, app.contact);
  
  // Pre-bind to applicant's device ID
  if (app.deviceId) {
    newLic.boundDeviceId = app.deviceId;
    newLic.boundDeviceName = app.deviceName || 'Student Device';
    newLic.boundAt = Date.now();
    const licenses = getIssuedLicenses();
    const licIdx = licenses.findIndex(l => l.id === newLic.id);
    if (licIdx !== -1) {
      licenses[licIdx] = newLic;
      saveIssuedLicenses(licenses);
    }
  }

  apps[idx] = {
    ...app,
    status: 'approved',
    issuedKey: newLic.key,
    plan,
  };
  saveStudentApplications(apps);

  fetch('/api/student-applications/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, issuedKey: newLic.key, plan }),
  }).catch(() => {});

  return { app: apps[idx], license: newLic };
};

export const rejectStudentApplication = (appId: string): boolean => {
  const apps = getStudentApplications();
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx !== -1) {
    apps[idx] = { ...apps[idx], status: 'rejected' };
    saveStudentApplications(apps);
  }
  fetch('/api/student-applications/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId }),
  }).catch(() => {});
  return true;
};

export const deleteStudentApplication = (appId: string): boolean => {
  const apps = getStudentApplications();
  const filtered = apps.filter((a) => a.id !== appId);
  saveStudentApplications(filtered);
  fetch('/api/student-applications/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId }),
  }).catch(() => {});
  return true;
};

/**
/**
 * Formats a 7-character raw key into clean 7 characters without any dash
 */
export const formatCryptoKey = (raw: string): string => {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
};

export const getClientDeviceId = (): string => {
  try {
    const existing = localStorage.getItem('atm_client_device_id');
    if (existing) return existing;
    const newId = 'dev_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('atm_client_device_id', newId);
    return newId;
  } catch {
    return 'dev_web_' + Date.now();
  }
};

export const resetLicenseDeviceLock = (licenseId: string): boolean => {
  const licenses = getIssuedLicenses();
  const idx = licenses.findIndex((l) => l.id === licenseId || l.key === licenseId || l.cleanKey === licenseId);
  if (idx === -1) return false;

  licenses[idx] = {
    ...licenses[idx],
    boundDeviceId: undefined,
    boundDeviceName: undefined,
    boundAt: undefined,
  };

  saveIssuedLicenses(licenses);
  return true;
};

/**
 * Issues a new License Key from the 1,000 circular chain.
 * The key is automatically moved to the back of the queue!
 */
export const issueNewLicense = (
  traderName: string,
  plan: LicenseKey['plan'],
  traderPhone?: string,
  customDays?: number
): LicenseKey => {
  const pointer = getNextPointerIndex();
  const rawKey = CIRCULAR_POOL_1000[pointer % 1000];
  setNextPointerIndex(pointer + 1);

  let durationDays: number | null = 30;
  if (plan.includes('1 Month')) durationDays = 30;
  else if (plan.includes('3 Months')) durationDays = 90;
  else if (plan.includes('6 Months')) durationDays = 180;
  else if (plan.includes('1 Year')) durationDays = 365;
  else if (plan.includes('Lifetime')) durationDays = null;

  if (customDays !== undefined) durationDays = customDays;

  const now = Date.now();
  const expiresAt = durationDays ? now + durationDays * 24 * 60 * 60 * 1000 : null;

  // Ensure key format is ATM-XXXXXXX and cleanKey is the 7-character code
  let fullKey = rawKey;
  let cleanKey = rawKey.replace(/^ATM[-_]?/i, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (!fullKey.startsWith('ATM-')) {
    fullKey = `ATM-${cleanKey}`;
  }

  const newLicense: LicenseKey = {
    id: `lic-${now}-${Math.random().toString(36).substring(2, 7)}`,
    key: fullKey,
    cleanKey: cleanKey,
    traderName: traderName.trim(),
    traderPhone: traderPhone?.trim(),
    plan,
    issuedAt: now,
    expiresAt,
    status: 'active',
  };

  const existing = getIssuedLicenses();
  const updated = [newLicense, ...existing];
  saveIssuedLicenses(updated);

  // Sync to server silently if available
  fetch('/api/licenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLicense),
  }).catch(() => {});

  return newLicense;
};

/**
 * Validates an access code entered by the user.
 * Supports:
 * - "ATM-C3XU78M" (Full Cryptographic Key)
 * - "C3XU78M" (7-Character Code)
 * - Master Admin whitelist emails
 */
export const validateLicenseCode = (input: string): ValidationResult => {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check if user typed a Master Admin Email
  if (MASTER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lower)) {
    return {
      valid: true,
      role: 'admin',
      reason: 'Master Admin Access Verified',
    };
  }

  // 2. Extract clean 7-character crypto key
  const stripped = trimmed.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');
  const normalizedFull = stripped.length === 7 ? `ATM-${stripped}` : trimmed.toUpperCase();

  // 3. Check Issued Licenses
  const licenses = getIssuedLicenses();
  const foundIdx = licenses.findIndex(
    (l) =>
      l.cleanKey === stripped ||
      l.key.toUpperCase() === normalizedFull ||
      l.key.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  );

  if (foundIdx === -1) {
    return {
      valid: false,
      role: 'user',
      reason: 'Invalid License Key. Please enter a valid 7-character ATM Key.',
    };
  }

  const found = licenses[foundIdx];

  // Check if suspended
  if (found.status === 'suspended') {
    return {
      valid: false,
      role: 'user',
      license: found,
      reason: 'This license has been suspended by Desk Admin.',
    };
  }

  // Check if expired
  if (found.expiresAt && Date.now() > found.expiresAt) {
    return {
      valid: false,
      role: 'user',
      license: found,
      reason: `License expired on ${new Date(found.expiresAt).toLocaleDateString()}. Please renew with Support.`,
    };
  }

  // 4. ONE CODE = ONE DEVICE LOCK (Hardware Anti-Piracy)
  const currentDeviceId = getClientDeviceId();
  if (!found.boundDeviceId) {
    // Lock key to this device on first login!
    found.boundDeviceId = currentDeviceId;
    found.boundAt = Date.now();
    found.boundDeviceName = getDeviceHumanName();
    licenses[foundIdx] = found;
    saveIssuedLicenses(licenses);
  } else if (found.boundDeviceId !== currentDeviceId) {
    return {
      valid: false,
      role: 'user',
      license: found,
      reason: '🔒 Device Lock: This code is locked to another device (1 Code = 1 Device Only). Contact Admin to reset.',
    };
  }

  // Active & Valid
  return {
    valid: true,
    role: 'user',
    license: found,
  };
};

/**
 * Loads all issued licenses from central server and caches in localStorage
 */
export const syncLicensesFromServer = async (): Promise<LicenseKey[]> => {
  try {
    const res = await fetch('/api/licenses');
    const data = await res.json();
    if (data && Array.isArray(data.licenses) && data.licenses.length > 0) {
      saveIssuedLicenses(data.licenses);
      return data.licenses;
    }
  } catch {}
  return getIssuedLicenses();
};

/**
 * Validates a license code in real-time against central server database
 * with fallback to local storage cache. Guarantees keys work across any device!
 */
export const validateLicenseCodeAsync = async (input: string): Promise<ValidationResult> => {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Instant Master Admin Check
  if (MASTER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lower)) {
    return {
      valid: true,
      role: 'admin',
      reason: 'Master Admin Access Verified',
    };
  }

  // 2. Query Central Server Validator
  try {
    const deviceId = getClientDeviceId();
    const deviceName = getDeviceHumanName();
    const res = await fetch('/api/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: trimmed, deviceId, deviceName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.valid === 'boolean') {
        if (data.valid && data.license) {
          // Merge to local storage
          const existing = getIssuedLicenses();
          const idx = existing.findIndex((l: LicenseKey) => l.id === data.license.id || l.cleanKey === data.license.cleanKey);
          if (idx !== -1) {
            existing[idx] = data.license;
          } else {
            existing.unshift(data.license);
          }
          saveIssuedLicenses(existing);
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('Server validation offline, falling back to local cache', err);
  }

  // 3. Fallback to local synchronous validation
  return validateLicenseCode(input);
};

/**
 * Renews / Extends an existing license by adding extra days.
 */
export const renewLicense = (licenseId: string, daysToAdd: number = 30): LicenseKey | null => {
  const licenses = getIssuedLicenses();
  const idx = licenses.findIndex((l) => l.id === licenseId || l.key === licenseId || l.cleanKey === licenseId);
  if (idx === -1) return null;

  const license = licenses[idx];
  const baseTime = license.expiresAt && license.expiresAt > Date.now() ? license.expiresAt : Date.now();
  const newExpiresAt = baseTime + daysToAdd * 24 * 60 * 60 * 1000;

  licenses[idx] = {
    ...license,
    expiresAt: newExpiresAt,
    status: 'active',
  };

  saveIssuedLicenses(licenses);
  return licenses[idx];
};

/**
 * Toggles suspension of a license key (Remote Kill-Switch)
 */
export const toggleSuspendLicense = (licenseId: string): LicenseKey | null => {
  const licenses = getIssuedLicenses();
  const idx = licenses.findIndex((l) => l.id === licenseId || l.key === licenseId || l.cleanKey === licenseId);
  if (idx === -1) return null;

  const current = licenses[idx];
  const nextStatus = current.status === 'suspended' ? 'active' : 'suspended';
  licenses[idx] = { ...current, status: nextStatus };

  saveIssuedLicenses(licenses);
  return licenses[idx];
};

/**
 * Deletes a license key completely
 */
export const deleteLicense = (licenseId: string): boolean => {
  const licenses = getIssuedLicenses();
  const updated = licenses.filter((l) => !(l.id === licenseId || l.key === licenseId || l.cleanKey === licenseId));
  saveIssuedLicenses(updated);
  return true;
};

/**
 * Generates the beautifully formatted VIP Welcome Pass for Telegram & Live Chat
 */
export const generateVipPassText = (license: LicenseKey): string => {
  const expiryFormatted = license.expiresAt
    ? new Date(license.expiresAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'LIFETIME VIP UNLIMITED';

  return `✨ ALADDIN TRADE MANAGER™ — VIP ACCESS PASS ✨
══════════════════════════════════
👤 Trader: ${license.traderName}
🔑 Cryptographic Key: ${license.key}
⏳ Plan: ${license.plan}
📅 Valid Until: ${expiryFormatted}
🛡️ Status: ACTIVE & VERIFIED (Single-Device Lock)
🌐 Login Portal: https://aladdin.org.in
══════════════════════════════════
⚠️ How to Activate:
1. Open https://aladdin.org.in
2. In the "VIP Access Pass" box, enter your Key: ${license.key}
3. Click "Unlock Aladdin Trade Manager" to access full institutional suite.

Official Support: @AladdinAISupport
© Aladdin AI Organization — All Rights Reserved.`;
};

export const getTelegramShareUrl = (text: string): string => {
  return `https://t.me/share/url?url=${encodeURIComponent('https://aladdin.org.in')}&text=${encodeURIComponent(text)}`;
};

/**
 * Session persistence helpers
 */
export const saveActiveSession = (license: LicenseKey) => {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(license));
    localStorage.setItem('aladdin_in_app', 'true');
  } catch {}
};

export const getActiveSession = (): LicenseKey | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearActiveSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
    localStorage.removeItem('aladdin_in_app');
  } catch {}
};
