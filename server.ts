import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch, limit, setDoc } from 'firebase/firestore';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));

// Initialize Firebase with the auto-generated config
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// --- Mock DB fallback for local logic ---
const dbPath = path.join(__dirname, 'database.json');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], payments: [], signals: [], bias: [] }));
}

let memDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(memDB, null, 2));
}

// --- REST to Firebase Proxy ---
app.get('/api/mock-db', (req, res) => {
  res.json(memDB);
});

app.post('/api/mock-db', (req, res) => {
  try {
    memDB = { ...memDB, ...req.body };
    saveDb();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// --- Crypto License Vault API & Pocket Option Trader ID Verification ---
const licensesPath = path.join(__dirname, 'passwords.json');
let licensesData: {
  masterPassword: string;
  licenses: any[];
  verifiedTraderIds: string[];
} = {
  masterPassword: 'admin',
  licenses: [],
  verifiedTraderIds: ['77554333', '143702223', '8849102', '9923184', '5521948'],
};

try {
  if (fs.existsSync(licensesPath)) {
    const raw = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    licensesData = {
      masterPassword: raw.masterPassword || 'admin',
      licenses: Array.isArray(raw.licenses) ? raw.licenses : (Array.isArray(raw.students) ? raw.students : []),
      verifiedTraderIds: Array.isArray(raw.verifiedTraderIds) && raw.verifiedTraderIds.length > 0
        ? raw.verifiedTraderIds
        : ['77554333', '143702223', '8849102', '9923184', '5521948'],
    };
  }
} catch (e) {
  console.error('Error loading licenses', e);
}

// Ensure initial demo keys are seeded so server is never empty
if (!licensesData.licenses || licensesData.licenses.length === 0) {
  licensesData.licenses = [
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
  saveLicenses();
}

function saveLicenses() {
  try {
    fs.writeFileSync(licensesPath, JSON.stringify(licensesData, null, 2));
  } catch (e) {
    console.error('Error saving licenses', e);
  }
}

// Master Admin Whitelist
const MASTER_ADMIN_EMAILS = [
  'thevivankhan@gmail.com',
  'ololootc@gmail.com',
  'thealphafxpro@gmail.com',
  'ololouniversity@gmail.com'
];

app.get('/api/licenses', (req, res) => {
  res.json({ success: true, licenses: licensesData.licenses });
});

app.post('/api/licenses', (req, res) => {
  try {
    const newLic = req.body;
    if (newLic && newLic.id) {
      const idx = licensesData.licenses.findIndex((l: any) => l.id === newLic.id);
      if (idx !== -1) {
        licensesData.licenses[idx] = newLic;
      } else {
        licensesData.licenses.unshift(newLic);
      }
      saveLicenses();
    }
    res.json({ success: true, licenses: licensesData.licenses });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// Central Server-Authoritative License Key Validator
// Allows any student on any device/domain to instantly validate keys issued by admin
app.post('/api/validate-license', (req, res) => {
  try {
    const { key, deviceId, deviceName } = req.body;
    const trimmed = (key || '').trim();
    const lower = trimmed.toLowerCase();

    // 1. Check Master Admin Whitelist Email
    if (MASTER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(lower)) {
      return res.json({
        valid: true,
        role: 'admin',
        reason: 'Master Admin Access Verified',
      });
    }

    // 2. Extract clean 7-character crypto key
    const stripped = trimmed.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '');
    const normalizedFull = stripped.length === 7 ? `ATM-${stripped}` : trimmed.toUpperCase();

    // 3. Search in server license vault
    const licenses = licensesData.licenses || [];
    let foundIdx = licenses.findIndex(
      (l: any) =>
        l.cleanKey === stripped ||
        (l.key && l.key.toUpperCase() === normalizedFull) ||
        (l.key && l.key.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === trimmed.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
    );

    if (foundIdx === -1) {
      // Check if an approved student application has this issuedKey
      const appWithKey = studentApplications.find((a: any) =>
        a.status === 'approved' && a.issuedKey && (
          a.issuedKey.toUpperCase() === normalizedFull ||
          a.issuedKey.toUpperCase().replace(/^ATM[-_\s]?/, '').replace(/[^A-Z0-9]/g, '') === stripped
        )
      );
      if (appWithKey) {
        const synthesizedLic = {
          id: 'lic-' + appWithKey.id,
          key: appWithKey.issuedKey,
          cleanKey: stripped,
          traderName: appWithKey.name,
          contact: appWithKey.contact,
          plan: appWithKey.plan || '1 Month ($47)',
          status: 'active',
          issuedAt: Date.now(),
          expiresAt: appWithKey.plan?.includes('Lifetime') ? null : Date.now() + 30 * 86400000,
          boundDeviceId: appWithKey.deviceId || deviceId || null,
          boundDeviceName: appWithKey.deviceName || deviceName || 'Device',
          boundAt: Date.now(),
        };
        licenses.unshift(synthesizedLic);
        saveLicenses();
        foundIdx = 0;
      } else {
        return res.json({
          valid: false,
          role: 'user',
          reason: 'Invalid License Key. Please enter a valid 7-character ATM Key.',
        });
      }
    }

    const found = licenses[foundIdx];

    // Check if suspended
    if (found.status === 'suspended') {
      return res.json({
        valid: false,
        role: 'user',
        license: found,
        reason: 'This license has been suspended by Desk Admin.',
      });
    }

    // Check if expired
    if (found.expiresAt && Date.now() > found.expiresAt) {
      return res.json({
        valid: false,
        role: 'user',
        license: found,
        reason: `License expired on ${new Date(found.expiresAt).toLocaleDateString()}. Please renew with Support.`,
      });
    }

    // 4. One Code = One Device Lock
    if (deviceId) {
      if (!found.boundDeviceId) {
        found.boundDeviceId = deviceId;
        found.boundDeviceName = deviceName || 'Device';
        found.boundAt = Date.now();
        licenses[foundIdx] = found;
        saveLicenses();
      } else if (found.boundDeviceId !== deviceId) {
        return res.json({
          valid: false,
          role: 'user',
          license: found,
          reason: '🔒 Device Lock: This code is locked to another device (1 Code = 1 Device Only). Contact Admin to reset.',
        });
      }
    }

    return res.json({
      valid: true,
      role: 'user',
      license: found,
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// --- Central Registered Students Storage ---
const studentsPath = path.join(__dirname, 'registered_students.json');
let registeredStudents: any[] = [];
try {
  if (fs.existsSync(studentsPath)) {
    registeredStudents = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  }
} catch (e) {
  console.error('Error loading registered students', e);
}

function saveRegisteredStudents() {
  try {
    fs.writeFileSync(studentsPath, JSON.stringify(registeredStudents, null, 2));
  } catch (e) {
    console.error('Error saving registered students', e);
  }
}

app.post('/api/register-student', (req, res) => {
  try {
    const { name, email, phone, password, deviceId, deviceName, traderId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const lowerEmail = email.trim().toLowerCase();
    const existingIdx = registeredStudents.findIndex((s: any) => s.email?.toLowerCase() === lowerEmail);

    const studentRecord = {
      id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: (name || 'Student Member').trim(),
      email: lowerEmail,
      phone: (phone || '').trim(),
      password: password.trim(),
      traderId: traderId ? String(traderId).trim() : undefined,
      devices: deviceId ? [deviceId] : [],
      deviceName: deviceName || 'Device',
      isLifetimePaid: true,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: Date.now(),
    };

    if (existingIdx !== -1) {
      registeredStudents[existingIdx] = { ...registeredStudents[existingIdx], ...studentRecord };
    } else {
      registeredStudents.unshift(studentRecord);
    }
    saveRegisteredStudents();

    // Also push to student applications queue for Admin Review
    const appRecord = {
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: studentRecord.name,
      email: studentRecord.email,
      contact: studentRecord.phone || studentRecord.email,
      traderId: studentRecord.traderId,
      deviceId: deviceId || 'device_' + Date.now(),
      deviceName: deviceName || 'Device',
      submittedAt: Date.now(),
      status: 'pending',
      isNew: true,
    };
    studentApplications.unshift(appRecord);
    saveStudentApps();

    res.json({ success: true, student: studentRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Student Registration Applications Queue ---
let studentApplications: any[] = [];
const appsPath = path.join(__dirname, 'student_applications.json');
try {
  if (fs.existsSync(appsPath)) {
    studentApplications = JSON.parse(fs.readFileSync(appsPath, 'utf8'));
  }
} catch (e) {
  console.error('Error loading student applications', e);
}

function saveStudentApps() {
  try {
    fs.writeFileSync(appsPath, JSON.stringify(studentApplications, null, 2));
  } catch (e) {
    console.error('Error saving student applications', e);
  }
}

app.get('/api/student-applications', (req, res) => {
  res.json({ success: true, applications: studentApplications });
});

// Lightweight Status polling for instant Admin Sound Notifications
app.get('/api/student-applications/status', (req, res) => {
  const pending = studentApplications.filter((a: any) => a.status === 'pending');
  res.json({
    success: true,
    totalCount: studentApplications.length,
    pendingCount: pending.length,
    latestApplicant: pending[0] || null,
  });
});

app.post('/api/student-applications', (req, res) => {
  try {
    const appData = req.body;
    if (appData && appData.id) {
      const idx = studentApplications.findIndex((a: any) => a.id === appData.id);
      if (idx !== -1) {
        studentApplications[idx] = appData;
      } else {
        studentApplications.unshift({ ...appData, isNew: true });
      }
      saveStudentApps();
    }
    res.json({ success: true, applications: studentApplications });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.post('/api/student-applications/approve', (req, res) => {
  try {
    const { appId, issuedKey, plan } = req.body;
    const idx = studentApplications.findIndex((a: any) => a.id === appId);
    if (idx !== -1) {
      studentApplications[idx] = {
        ...studentApplications[idx],
        status: 'approved',
        issuedKey,
        plan,
        isNew: false,
      };
      saveStudentApps();
    }
    res.json({ success: true, applications: studentApplications });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// --- Tawk.to Live Chat Config ---
let tawkConfig = { propertyId: '6aedf91657710a4002b40288', widgetId: 'default' };
const tawkPath = path.join(__dirname, 'tawk_config.json');
try {
  if (fs.existsSync(tawkPath)) {
    tawkConfig = JSON.parse(fs.readFileSync(tawkPath, 'utf8'));
  } else {
    fs.writeFileSync(tawkPath, JSON.stringify(tawkConfig, null, 2));
  }
} catch {}

app.get('/api/tawk-config', (req, res) => {
  res.json({ success: true, ...tawkConfig });
});

app.post('/api/tawk-config', (req, res) => {
  try {
    const { propertyId, widgetId } = req.body;
    tawkConfig = {
      propertyId: (propertyId || '').trim(),
      widgetId: (widgetId || 'default').trim(),
    };
    fs.writeFileSync(tawkPath, JSON.stringify(tawkConfig, null, 2));
    res.json({ success: true, ...tawkConfig });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// --- Pocket Option Real-time Trader ID Verification ---
app.get('/api/verify-trader-id', (req, res) => {
  const rawId = ((req.query.id as string) || '').trim();
  if (!rawId) {
    return res.json({ verified: false, message: 'Please enter a Trader ID.' });
  }

  const cleanNum = rawId.replace(/\D/g, '');
  const verifiedList = licensesData.verifiedTraderIds || [];

  const isMatch = verifiedList.some((v: string) => {
    return v === rawId || (cleanNum.length > 0 && v.replace(/\D/g, '') === cleanNum);
  });

  return res.json({
    verified: isMatch,
    traderId: rawId,
    accountCapital: 0,
    accessLevel: 0,
  });
});

app.get('/api/admin/trader-ids', (req, res) => {
  res.json({ success: true, verifiedTraderIds: licensesData.verifiedTraderIds || [] });
});

app.post('/api/admin/trader-ids', (req, res) => {
  try {
    const { action, id } = req.body;
    const cleanId = (id || '').trim();
    if (!licensesData.verifiedTraderIds) {
      licensesData.verifiedTraderIds = ['77554333', '143702223', '8849102', '9923184', '5521948'];
    }
    if (action === 'add' && cleanId) {
      if (!licensesData.verifiedTraderIds.includes(cleanId)) {
        licensesData.verifiedTraderIds.unshift(cleanId);
        saveLicenses();
      }
    } else if (action === 'remove' && cleanId) {
      licensesData.verifiedTraderIds = licensesData.verifiedTraderIds.filter((x: string) => x !== cleanId);
      saveLicenses();
    }
    res.json({ success: true, verifiedTraderIds: licensesData.verifiedTraderIds });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});// --- Robust Telegram Redirect Bridge (Bypasses ISP blocks and pop-up filters) ---
app.get(['/telegram', '/api/telegram'], (req, res) => {
  const queryText = (req.query.text as string) || '';
  const encoded = encodeURIComponent(queryText);
  const tgProtocol = `tg://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}`;
  const androidIntent = `intent://resolve?domain=AladdinAISupport${encoded ? `&text=${encoded}` : ''}#Intent;package=org.telegram.messenger;scheme=tg;end;`;
  const tgDogUrl = `https://telegram.dog/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;
  const isGdShortUrl = `https://is.gd/pvcvfU`;
  const tinyUrl = `https://tinyurl.com/22njzzet`;
  const webUrl = `https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DAladdinAISupport`;
  const tmeUrl = `https://t.me/AladdinAISupport${encoded ? `?text=${encoded}` : ''}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening Aladdin AI Support...</title>
  <meta property="al:android:url" content="${tgProtocol}">
  <meta property="al:android:package" content="org.telegram.messenger">
  <meta property="al:ios:url" content="${tgProtocol}">
  <meta property="al:ios:app_store_id" content="686449807">
  <style>
    * { box-sizing: border-box; }
    body {
      background: #090e17;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 20px;
      padding: 28px 20px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 45px rgba(0,0,0,0.6);
    }
    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #0088cc, #00a884);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
      box-shadow: 0 0 25px rgba(0, 136, 204, 0.5);
    }
    .title {
      font-size: 19px;
      font-weight: 800;
      margin: 0 0 6px;
      color: #ffffff;
    }
    .desc {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 20px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      background: #0088cc;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      padding: 13px 16px;
      border-radius: 12px;
      font-size: 14px;
      transition: all 0.2s;
      margin-bottom: 10px;
      border: none;
      cursor: pointer;
    }
    .btn:hover { background: #0099e6; transform: translateY(-1px); }
    .btn-green {
      background: #10b981;
      color: #042f2e;
      font-weight: 800;
    }
    .btn-green:hover { background: #059669; color: #ffffff; }
    .btn-secondary {
      background: #1f2937;
      border: 1px solid #374151;
      color: #e2e8f0;
      font-size: 13px;
    }
    .btn-secondary:hover { background: #374151; }
    .spinner {
      width: 22px;
      height: 22px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 16px auto 0;
    }
    .note {
      font-size: 11px;
      color: #64748b;
      margin-top: 14px;
      line-height: 1.4;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
      </svg>
    </div>
    <div class="title">Opening Telegram Support...</div>
    <div class="desc">Connecting you directly with <strong>@AladdinAISupport</strong></div>
    <div class="badge">Verified Aladdin Support</div>

    <a id="btnApp" class="btn btn-green" href="${tgProtocol}">📲 Open in Telegram App</a>
    <a id="btnDog" class="btn" href="${tgDogUrl}">🌐 Open Support (No VPN Needed)</a>
    <a id="btnShort" class="btn btn-secondary" href="${isGdShortUrl}">🔗 Open via Short Link (is.gd)</a>
    <a id="btnWeb" class="btn btn-secondary" href="${webUrl}">💻 Open in Telegram Web</a>

    <div class="spinner"></div>
    <p class="note">Redirecting automatically in 1 second. If Telegram doesn't open, tap the green button above.</p>
  </div>

  <script>
    var isAndroid = /Android/i.test(navigator.userAgent);
    var tgProto = ${JSON.stringify(tgProtocol)};
    var tgIntent = ${JSON.stringify(androidIntent)};
    var fallbackUrl = ${JSON.stringify(tgDogUrl)};

    // 1. Try launching native app protocol or Android Intent
    try {
      if (isAndroid) {
        window.location.href = tgIntent;
      } else {
        window.location.href = tgProto;
      }
    } catch(e) {}

    // 2. If app didn't take over within 1.2s, smoothly forward to the unblocked telegram.dog mirror
    setTimeout(function() {
      window.location.href = fallbackUrl;
    }, 1200);
  </script>
</body>
</html>`);
});

// --- Server-side VPN Relay / Broker Proxy for Pocket Option ---
app.get('/api/broker-proxy', async (req, res) => {
  try {
    const rawUrl = (req.query.url as string) || 'https://m.po.life/en/r/mphdnyllo5';
    // Validate target is pocket option or mirror
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      parsedUrl = new URL('https://m.po.life/en/r/mphdnyllo5');
    }

    const userAgent = (req.headers['user-agent'] as string) || 
      'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

    const upstreamRes = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    const finalUrl = upstreamRes.url || parsedUrl.toString();
    const contentType = upstreamRes.headers.get('content-type') || 'text/html';

    // Remove anti-frame and security headers
    res.removeHeader('X-Frame-Options');
    res.removeHeader('x-frame-options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('content-security-policy');
    res.removeHeader('Content-Security-Policy-Report-Only');
    res.removeHeader('content-security-policy-report-only');
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    if (contentType.includes('text/html')) {
      let html = await upstreamRes.text();
      
      // Inject base href tag pointing to final landing domain so all static scripts/css/images resolve
      const baseTag = `<base href="${finalUrl}">`;
      
      // Frame shield script: overrides top/parent frame-busting scripts
      const frameShield = `
<script>
  (function() {
    try {
      Object.defineProperty(window, 'top', { get: function() { return window.self; }, configurable: true });
      Object.defineProperty(window, 'parent', { get: function() { return window.self; }, configurable: true });
    } catch(e) {}
  })();
</script>
`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}${frameShield}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}${frameShield}`);
      } else {
        html = baseTag + frameShield + html;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } else {
      const arrayBuf = await upstreamRes.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.send(Buffer.from(arrayBuf));
    }
  } catch (error: any) {
    console.error('Broker proxy error:', error);
    res.status(502).send(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Broker Relay</title></head>
      <body style="background:#090d16;color:#e2e8f0;font-family:sans-serif;padding:24px;text-align:center;">
        <h3 style="color:#f59e0b;">Relay Connecting...</h3>
        <p style="font-size:13px;color:#94a3b8;">${error.message || 'Connecting to broker mirror...'}</p>
        <button onclick="location.reload()" style="background:#3b82f6;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;">Retry</button>
      </body>
      </html>
    `);
  }
});

app.get('/api/broker-status', async (req, res) => {
  const start = Date.now();
  try {
    const testRes = await fetch('https://pocket-friends.co/r/mphdnyllo5', {
      method: 'HEAD',
      redirect: 'manual'
    });
    const ping = Date.now() - start;
    res.json({
      online: true,
      pingMs: ping,
      vpnActive: true,
      status: testRes.status,
      mirror: 'pocket-friends.co',
      referral: 'mphdnyllo5'
    });
  } catch (err: any) {
    res.json({
      online: false,
      pingMs: Date.now() - start,
      vpnActive: true,
      error: err.message
    });
  }
});

// API Routes
app.post('/api/verify-password', async (req, res) => {
  const { email, password, deviceId } = req.body;
  const lowerEmail = (email || '').trim().toLowerCase();
  const trimmedPassword = (password || '').trim();

  // 1. Check Central Registered Students Storage First
  const localStudent = registeredStudents.find(
    (s: any) => s.email?.toLowerCase() === lowerEmail
  );

  if (localStudent) {
    if (localStudent.password !== trimmedPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Password does not match.' });
    }
    if (!localStudent.devices) localStudent.devices = [];
    if (deviceId && !localStudent.devices.includes(deviceId)) {
      localStudent.devices.push(deviceId);
      saveRegisteredStudents();
    }
    localStudent.lastLogin = Date.now();
    saveRegisteredStudents();
    return res.json({
      success: true,
      student: localStudent,
    });
  }

  // 2. Check Firestore fallback
  try {
    const q = query(collection(db, 'students'), where('email', '==', lowerEmail));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const studentDoc = snapshot.docs[0];
    const student = studentDoc.data();

    if (student.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!student.devices) student.devices = [];
    if (!student.maxDevices) student.maxDevices = 1;

    if (!student.devices.includes(deviceId)) {
      if (student.devices.length >= student.maxDevices) {
        return res.status(403).json({ 
          success: false, 
          message: `Device limit reached (${student.maxDevices}/${student.maxDevices}). You cannot login from a new device.` 
        });
      }
      student.devices.push(deviceId);
    }

    student.lastLogin = Date.now();
    student.isOnline = true;
    
    await updateDoc(doc(db, 'students', studentDoc.id), {
      devices: student.devices,
      lastLogin: student.lastLogin,
      isOnline: student.isOnline
    });

    res.json({ success: true, student: { id: studentDoc.id, ...student } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/logout', async (req, res) => {
  const { email, password } = req.body;
  try {
    const q = query(collection(db, 'students'), where('email', '==', email.trim().toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const studentDoc = snapshot.docs[0];
      if (studentDoc.data().password === password) {
        await updateDoc(doc(db, 'students', studentDoc.id), { isOnline: false });
        return res.json({ success: true });
      }
    }
    res.status(404).json({ success: false, message: 'Student not found' });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/check-auth', async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    const q = query(collection(db, 'students'), where('email', '==', email.trim().toLowerCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const student = snapshot.docs[0].data();
      if (student.password === password && student.devices && student.devices.includes(deviceId)) {
        return res.json({ success: true, isOnline: student.isOnline });
      }
    }
    res.json({ success: false });
  } catch (error) {
    console.error("Check auth error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/verify', async (req, res) => {
  const { masterPassword } = req.body;
  try {
    const q = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      res.json({ success: true, adminName: snapshot.docs[0].data().name });
    } else {
      if (masterPassword === 'admin') {
         const allAdminsQ = query(collection(db, 'admins'), limit(1));
         const allAdmins = await getDocs(allAdminsQ);
         if (allAdmins.empty) {
            await addDoc(collection(db, 'admins'), { name: 'Main Admin', password: 'admin', role: 'admin' });
            return res.json({ success: true, adminName: 'Main Admin' });
         }
      }
      res.status(401).json({ success: false, message: 'Invalid admin password' });
    }
  } catch (error) {
    console.error("Admin verify error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/passwords', async (req, res) => {
  const { masterPassword } = req.query;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, students });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/passwords', async (req, res) => {
  const { masterPassword, name, email, password, maxDevices } = req.body;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const emailQ = query(collection(db, 'students'), where('email', '==', email.trim().toLowerCase()));
    const emailSnap = await getDocs(emailQ);
    if (!emailSnap.empty) {
      return res.status(400).json({ success: false, message: 'Email/Mobile already exists' });
    }
    
    const passQ = query(collection(db, 'students'), where('password', '==', password));
    const passSnap = await getDocs(passQ);
    if (!passSnap.empty) {
      return res.status(400).json({ success: false, message: 'Password already exists' });
    }
    
    const newStudent = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      maxDevices: maxDevices || 1,
      devices: [],
      isOnline: false,
      lastLogin: null
    };
    
    const docRef = await addDoc(collection(db, 'students'), newStudent);
    res.json({ success: true, student: { id: docRef.id, ...newStudent } });
  } catch (error) {
    console.error("Add student error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/passwords/:id', async (req, res) => {
  const { masterPassword } = req.body;
  const { id } = req.params;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    await deleteDoc(doc(db, 'students', id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/reset-devices/:id', async (req, res) => {
  const { masterPassword } = req.body;
  const { id } = req.params;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    await updateDoc(doc(db, 'students', id), {
      devices: [],
      isOnline: false,
      lastLogin: null
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Reset devices error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/students/:id/max-devices', async (req, res) => {
  const { masterPassword, maxDevices } = req.body;
  const { id } = req.params;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    await updateDoc(doc(db, 'students', id), { maxDevices });
    res.json({ success: true });
  } catch (error) {
    console.error("Update max devices error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/admins', async (req, res) => {
  const { masterPassword } = req.query;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const adminsSnap = await getDocs(collection(db, 'admins'));
    const admins = adminsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, admins });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/full-state', async (req, res) => {
  const { masterPassword } = req.query;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      if (masterPassword === 'admin') {
         const allAdminsQ = query(collection(db, 'admins'), limit(1));
         const allAdmins = await getDocs(allAdminsQ);
         if (allAdmins.empty) {
            await addDoc(collection(db, 'admins'), { name: 'Main Admin', password: 'admin', role: 'admin' });
            return res.json({ success: true, data: { admins: [{ name: 'Main Admin', password: 'admin' }], students: [] } });
         }
      }
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const adminsSnap = await getDocs(collection(db, 'admins'));
    const admins = adminsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    res.json({ success: true, data: { admins, students } });
  } catch (error) {
    console.error("Get full state error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/restore-state', async (req, res) => {
  const { backup } = req.body;
  try {
    const studentsSnap = await getDocs(query(collection(db, 'students'), limit(1)));
    const adminsSnap = await getDocs(query(collection(db, 'admins'), limit(2)));
    
    const isServerEmpty = studentsSnap.empty && (adminsSnap.empty || (adminsSnap.size === 1 && adminsSnap.docs[0].data().password === 'admin'));
    
    if (isServerEmpty && backup && backup.admins && backup.students) {
      const batch = writeBatch(db);
      
      if (!adminsSnap.empty) {
        batch.delete(doc(db, 'admins', adminsSnap.docs[0].id));
      }
      
      backup.admins.forEach((admin: any) => {
        const newRef = doc(collection(db, 'admins'));
        batch.set(newRef, { name: admin.name, password: admin.password, role: 'admin' });
      });
      
      backup.students.forEach((student: any) => {
        const newRef = doc(collection(db, 'students'));
        batch.set(newRef, {
          name: student.name,
          email: student.email,
          password: student.password,
          maxDevices: student.maxDevices || 1,
          devices: student.devices || [],
          isOnline: student.isOnline || false,
          lastLogin: student.lastLogin || null
        });
      });
      
      await batch.commit();
      return res.json({ success: true });
    }
    
    res.status(403).json({ success: false, message: 'Restore not allowed' });
  } catch (error) {
    console.error("Restore state error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/admin/admins', async (req, res) => {
  const { masterPassword, name, password } = req.body;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const passQ = query(collection(db, 'admins'), where('password', '==', password));
    const passSnap = await getDocs(passQ);
    if (!passSnap.empty) {
      return res.status(400).json({ success: false, message: 'Admin password already exists' });
    }
    
    const newAdmin = { name, password, role: 'admin' };
    const docRef = await addDoc(collection(db, 'admins'), newAdmin);
    
    res.json({ success: true, admin: { id: docRef.id, ...newAdmin } });
  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/admins/:id', async (req, res) => {
  const { masterPassword } = req.body;
  const { id } = req.params;
  try {
    const adminQ = query(collection(db, 'admins'), where('password', '==', masterPassword));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const allAdmins = await getDocs(collection(db, 'admins'));
    if (allAdmins.size <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the last admin' });
    }
    
    await deleteDoc(doc(db, 'admins', id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
