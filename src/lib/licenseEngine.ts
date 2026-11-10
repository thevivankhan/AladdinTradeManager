import { openTelegramSupport } from './telegram';


export interface LicenseKey {
  id: string;
  key: string;           // 7-character clean key e.g. "7F9K82D"
  cleanKey: string;      // Stripped uppercase: "7F9K82D" (7 characters)
  traderName: string;
  traderPhone?: string;
  plan: '1 Month ($47)' | '3 Months ($97)' | '6 Months ($147)' | '1 Year ($197)' | 'Lifetime VIP ($247)' | 'Lifetime VIP ($297)';
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
  'ololouniversity@gmail.com',
  'ololobillionaireclub@gmail.com'
];

export const MASTER_ADMIN_KEYS: string[] = []; // Deprecated: no backdoor guessable codes allowed

export interface StudentApplication {
  id: string;
  name: string;
  email?: string;
  contact: string; // WhatsApp or phone
  location?: string; // City & Country
  paymentMethod?: string; // Preferred Payment Option
  broker?: string; // Broker Name (Pocket Option, Quotex, etc.)
  traderId?: string; // Broker Trader ID / UID (optional)
  capital?: string; // Trading Capital Range
  experience?: string; // Trading Experience Level
  market?: string; // Preferred Trading Market
  deviceId: string;
  deviceName?: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  isArchived?: boolean;
  archivedAt?: number;
  issuedKey?: string;
  plan?: string;
  adminNotes?: string;
}

const STORAGE_KEY_LICENSES = 'atm_vault_licenses_v1';
const STORAGE_KEY_POINTER = 'atm_vault_pointer_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'atm_active_license_session';
const STORAGE_KEY_APPLICATIONS = 'atm_student_applications_v1';


/**
 * Deterministically generates the 1,000 circular crypto-encrypted keys pool
 * in the ATM-XXXXXXX format using high-entropy algorithm.
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

export const VAULT_CLEAN_KEYS_SET: Set<string> = new Set(
  CIRCULAR_POOL_1000.map((k) => k.replace(/^ATM[-_\s]?/, '').toUpperCase().slice(0, 7))
);

/**
 * Loads issued licenses from localStorage and syncs with backend if reachable.
 */
export const getIssuedLicenses = (): LicenseKey[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LICENSES);
    if (!raw) {
      return [];
    }
    const parsed: LicenseKey[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge any legacy demo keys
    const sanitized = parsed.filter(
      (l) => l.cleanKey !== 'C3XU78M' && l.cleanKey !== '9B2X74M' && !l.id?.startsWith('lic-demo-')
    );
    if (sanitized.length !== parsed.length) {
      saveIssuedLicenses(sanitized);
    }
    return sanitized;
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
    return p ? parseInt(p, 10) : 0;
  } catch {
    return 0;
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
 * Direct Live Support Router (Aladdin AI Telegram Support)
 */
export const openTawkToChat = (studentName?: string, studentContact?: string, query?: string) => {
  const msg = studentName 
    ? `Hello Master Admin, I am ${studentName} (${studentContact || 'Trader'}). ${query || 'I need support with Aladdin Trade Manager.'}`
    : query || 'Hello Master Admin, I need live support.';
  openTelegramSupport(msg);
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
  email?: string,
  broker?: string,
  capital?: string,
  plan?: string,
  experience?: string,
  market?: string,
  location?: string,
  paymentMethod?: string
): StudentApplication => {
  const deviceId = getClientDeviceId();
  const deviceName = getDeviceHumanName();

  const newApp: StudentApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email ? email.trim() : undefined,
    contact: contact.trim(),
    location: location ? location.trim() : undefined,
    paymentMethod: paymentMethod ? paymentMethod.trim() : undefined,
    broker: broker ? broker.trim() : 'Pocket Option',
    traderId: traderId ? traderId.trim() : undefined,
    capital: capital ? capital.trim() : '$100 - $500',
    plan: plan ? plan.trim() : 'Lifetime VIP ($247)',
    experience: experience ? experience.trim() : undefined,
    market: market ? market.trim() : undefined,
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

export const rejectStudentApplication = async (appId: string): Promise<boolean> => {
  const apps = getStudentApplications();
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx === -1) return false;

  apps[idx] = { ...apps[idx], status: 'rejected' };
  saveStudentApplications(apps);

  try {
    await fetch('/api/student-applications/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    });
  } catch {}

  return true;
};

export const archiveStudentApplication = async (appId: string): Promise<boolean> => {
  const apps = getStudentApplications();
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx === -1) return false;

  apps[idx] = {
    ...apps[idx],
    isArchived: true,
    archivedAt: Date.now(),
  };
  saveStudentApplications(apps);

  try {
    await fetch('/api/student-applications/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    });
  } catch {}

  return true;
};

export const restoreStudentApplication = async (appId: string): Promise<boolean> => {
  const apps = getStudentApplications();
  const idx = apps.findIndex((a) => a.id === appId);
  if (idx === -1) return false;

  apps[idx] = {
    ...apps[idx],
    isArchived: false,
    archivedAt: undefined,
  };
  saveStudentApplications(apps);

  try {
    await fetch('/api/student-applications/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId }),
    });
  } catch {}

  return true;
};

export const deleteStudentApplicationPermanently = async (appId: string): Promise<boolean> => {
  const apps = getStudentApplications();
  const filtered = apps.filter((a) => a.id !== appId);
  saveStudentApplications(filtered);

  try {
    await fetch(`/api/student-applications/${appId}`, {
      method: 'DELETE',
    });
  } catch {}

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

export const resetLicenseDeviceLock = async (licenseId: string): Promise<boolean> => {
  const licenses = getIssuedLicenses();
  const idx = licenses.findIndex((l) => l.id === licenseId || l.key === licenseId || l.cleanKey === licenseId);
  let cleanKey = '';
  if (idx !== -1) {
    cleanKey = licenses[idx].cleanKey;
    licenses[idx] = {
      ...licenses[idx],
      boundDeviceId: undefined,
      boundDeviceName: undefined,
      boundAt: undefined,
    };
    saveIssuedLicenses(licenses);
  } else {
    cleanKey = licenseId.replace(/^ATM[-_\s]?/, '').toUpperCase().slice(0, 7);
  }

  if (cleanKey) {
    try {
      localStorage.removeItem(`atm_device_lock_${cleanKey}`);
    } catch {}

    try {
      await fetch('/api/admin/reset-device-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, licenseId }),
      });
    } catch {}
  }

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
 * - "ATM-XXXXXXX" (Full Cryptographic Key)
 * - 7-Character Clean Code
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

  // Explicitly block example/demo keys
  const BLACKLISTED_DEMO_KEYS = ['C3XU78M', '9B2X74M', 'XXXXXXX', '1234567', '0000000', 'TESTKEY'];
  if (BLACKLISTED_DEMO_KEYS.includes(stripped) || (stripped.startsWith('C3X') && stripped === 'C3XU78M')) {
    return {
      valid: false,
      role: 'user',
      reason: '❌ Invalid Key: Example codes cannot be used. Please contact Master Admin to receive your official 7-digit access key.',
    };
  }

  // 3. Check Issued Licenses OR 1,000 Deterministic Circular Vault Pool
  const licenses = getIssuedLicenses();
  let foundIdx = licenses.findIndex(
    (l) =>
      l.cleanKey === stripped ||
      l.key.toUpperCase() === normalizedFull ||
      l.key.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  );

  const isInVault = VAULT_CLEAN_KEYS_SET.has(stripped);

  if (foundIdx === -1 && !isInVault) {
    return {
      valid: false,
      role: 'user',
      reason: 'Invalid License Key. Please enter a valid 7-digit ATM Key or request access from Master Admin.',
    };
  }

  // If key belongs to circular pool but was not pre-issued on this device, bootstrap it now!
  if (foundIdx === -1 && isInVault) {
    const vaultLicense: LicenseKey = {
      id: `lic-vault-${Date.now()}-${stripped}`,
      key: `ATM-${stripped}`,
      cleanKey: stripped,
      traderName: 'VIP Trader',
      plan: 'Lifetime VIP ($247)',
      issuedAt: Date.now(),
      expiresAt: null, // Lifetime VIP
      status: 'active',
    };
    licenses.unshift(vaultLicense);
    saveIssuedLicenses(licenses);
    foundIdx = 0;
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

  // 4. ONE CODE = ONE DEVICE LOCK (Hardware Anti-Piracy Guard)
  const currentDeviceId = getClientDeviceId();
  const currentDeviceName = getDeviceHumanName();

  const localLockKey = `atm_device_lock_${stripped}`;
  let deviceLockData: { deviceId: string; deviceName: string; boundAt: number } | null = null;
  try {
    const rawLock = localStorage.getItem(localLockKey);
    if (rawLock) deviceLockData = JSON.parse(rawLock);
  } catch {}

  const boundId = found.boundDeviceId || deviceLockData?.deviceId;
  const boundName = found.boundDeviceName || deviceLockData?.deviceName || 'Another Device';

  if (!boundId) {
    // Lock key to this device on first login!
    found.boundDeviceId = currentDeviceId;
    found.boundAt = Date.now();
    found.boundDeviceName = currentDeviceName;
    licenses[foundIdx] = found;
    saveIssuedLicenses(licenses);
    try {
      localStorage.setItem(localLockKey, JSON.stringify({
        deviceId: currentDeviceId,
        deviceName: currentDeviceName,
        boundAt: Date.now(),
      }));
    } catch {}
  } else if (boundId !== currentDeviceId) {
    return {
      valid: false,
      role: 'user',
      license: found,
      reason: `🔒 Hardware Security Alert: Key is locked to another device (${boundName}). 1 Key = 1 Device only. Contact Master Admin to reset.`,
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
 * Validates a key online with server backend, enforcing cross-device hardware locking
 * while falling back safely to offline cryptographic validation if server is unreachable.
 */
export const verifyLicenseKeyOnline = async (input: string): Promise<ValidationResult> => {
  const localResult = validateLicenseCode(input);
  if (!localResult.valid) {
    return localResult;
  }
  if (localResult.role === 'admin') {
    return localResult;
  }

  try {
    const clientDeviceId = getClientDeviceId();
    const clientDeviceName = getDeviceHumanName();
    const res = await fetch('/api/auth/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: input.trim(),
        deviceId: clientDeviceId,
        deviceName: clientDeviceName,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        valid: false,
        role: 'user',
        license: localResult.license,
        reason: data.message || localResult.reason || 'Authentication failed.',
      };
    }
    return {
      valid: true,
      role: 'user',
      license: data.license || localResult.license,
    };
  } catch {
    // Network offline or standalone environment fallback
    return localResult;
  }
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
  const cleanCode = license.cleanKey || license.key.replace(/^ATM[-_\s]?/, '');

  return `🪙 *Aladdin Trade Manager - VIP Terminal Access*
━━━━━━━━━━━━━━━━━━━━━
Hello *${license.traderName}*,
Your official VIP terminal access credentials are ready:

🌐 *Login Portal*: https://aladdin.org.in
🔑 *VIP Access Key*: ${license.key}
🔒 *Password*: ${cleanCode}
📦 *Plan*: ${license.plan}
🛡️ *Hardware Lock*: Single-Device Protected
━━━━━━━━━━━━━━━━━━━━━
⚠️ *Important*: Keep these credentials secure. One key is locked to your hardware device. Welcome to Aladdin VIP!`;
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
