import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Donor, BloodRequest, Event, HomepageContent, MediaAsset } from './models.js';

const backendDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(backendDirectory, '.env') });
dotenv.config({ path: resolve(backendDirectory, '../.env') });
// Keep the local coordinator passcode in sync when the dev supervisor inherited an older environment.
for (const envPath of [resolve(backendDirectory, '.env'), resolve(backendDirectory, '../.env')]) {
  try {
    const localPasscode = dotenv.parse(readFileSync(envPath)).ADMIN_PASSCODE;
    if (localPasscode) {
      process.env.ADMIN_PASSCODE = localPasscode;
      break;
    }
  } catch {}
}

const app = express();
const port = Number(process.env.PORT || 4000);
const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const publicHits = new Map();
const apiEndpoints = [
  { group: 'Status & access', method: 'GET', path: '/api/health', access: 'Public', purpose: 'Check API, MongoDB, and admin sign-in readiness.' },
  { group: 'Status & access', method: 'POST', path: '/api/auth/login', access: 'Public', purpose: 'Sign in with the coordinator passcode.' },
  { group: 'Public website', method: 'GET', path: '/api/public/homepage', access: 'Public', purpose: 'Load published homepage content and live totals.' },
  { group: 'Public website', method: 'GET', path: '/api/public/donors', access: 'Public', purpose: 'Find donors who chose to appear in the directory.' },
  { group: 'Public website', method: 'POST', path: '/api/public/donors', access: 'Public', purpose: 'Register a donor with directory consent.' },
  { group: 'Public website', method: 'GET', path: '/api/public/featured-donors', access: 'Public', purpose: 'Show donors who consented to a featured photo.' },
  { group: 'Public website', method: 'GET', path: '/api/public/events', access: 'Public', purpose: 'List upcoming public events.' },
  { group: 'Public website', method: 'GET', path: '/api/public/requests', access: 'Public', purpose: 'List current blood requests.' },
  { group: 'Public website', method: 'POST', path: '/api/public/requests', access: 'Public', purpose: 'Submit a private blood request.' },
  { group: 'Public website', method: 'GET', path: '/api/public/media/:id', access: 'Public', purpose: 'Load an uploaded public image.' },
  { group: 'Admin CRM', method: 'GET', path: '/api/dashboard', access: 'Admin', purpose: 'Load CRM totals and recent requests.' },
  { group: 'Admin CRM', method: 'GET', path: '/api/donors', access: 'Admin', purpose: 'List and search donor records.' },
  { group: 'Admin CRM', method: 'POST', path: '/api/donors', access: 'Admin', purpose: 'Add a donor record.' },
  { group: 'Admin CRM', method: 'PATCH', path: '/api/donors/:id', access: 'Admin', purpose: 'Update a donor record.' },
  { group: 'Admin CRM', method: 'DELETE', path: '/api/donors/:id', access: 'Admin', purpose: 'Permanently remove a donor record.' },
  { group: 'Admin CRM', method: 'GET', path: '/api/requests', access: 'Admin', purpose: 'List blood requests.' },
  { group: 'Admin CRM', method: 'POST', path: '/api/requests', access: 'Admin', purpose: 'Add a blood request.' },
  { group: 'Admin CRM', method: 'PATCH', path: '/api/requests/:id', access: 'Admin', purpose: 'Update a request or its status.' },
  { group: 'Admin CRM', method: 'DELETE', path: '/api/requests/:id', access: 'Admin', purpose: 'Permanently remove a blood request.' },
  { group: 'Admin CRM', method: 'GET', path: '/api/events', access: 'Admin', purpose: 'List club events.' },
  { group: 'Admin CRM', method: 'POST', path: '/api/events', access: 'Admin', purpose: 'Create an event.' },
  { group: 'Admin CRM', method: 'PATCH', path: '/api/events/:id', access: 'Admin', purpose: 'Update an event.' },
  { group: 'Admin CRM', method: 'DELETE', path: '/api/events/:id', access: 'Admin', purpose: 'Permanently remove an event.' },
  { group: 'Admin CRM', method: 'POST', path: '/api/media', access: 'Admin', purpose: 'Upload an image for the website or CRM.' },
  { group: 'Admin CRM', method: 'GET', path: '/api/homepage/content', access: 'Admin', purpose: 'Load editable homepage content.' },
  { group: 'Admin CRM', method: 'PUT', path: '/api/homepage/content', access: 'Admin', purpose: 'Save homepage text, sections, images, and contacts.' },
];
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This website origin is not allowed by the API CORS settings.'));
  },
}));
app.use(express.json({ limit: '1mb' }));
const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: (_req, file, done) => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) return done(new Error('Upload a JPG, PNG, WebP or GIF image.'));
  done(null, true);
} });

async function compressImageBuffer(buffer, mimetype, originalname = 'image.webp') {
  // Preserve animated GIFs
  if (mimetype === 'image/gif') {
    return { data: buffer, contentType: 'image/gif', fileName: originalname.slice(0, 160) };
  }
  try {
    // Auto-orient via EXIF, downscale extreme resolutions to max 1600px without upscaling,
    // and encode into high-quality WebP (quality 85) for 75-90% size reduction with crisp fidelity.
    const compressed = await sharp(buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 4,
        smartSubsample: true,
      })
      .toBuffer();

    const baseName = originalname.replace(/\.[^/.]+$/, '').slice(0, 150);
    return {
      data: compressed,
      contentType: 'image/webp',
      fileName: `${baseName}.webp`,
    };
  } catch (err) {
    console.warn('Sharp compression fallback to original buffer:', err.message);
    return { data: buffer, contentType: mimetype, fileName: originalname.slice(0, 160) };
  }
}

function limitPublicWrites(req, res, next) {
  const now = Date.now(); const key = req.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
  const previous = publicHits.get(key);
  if (!previous || now - previous.startedAt > 60 * 60 * 1000) publicHits.set(key, { startedAt: now, count: 1 });
  else if (previous.count >= 12) return res.status(429).json({ error: 'Please wait before sending another community form.' });
  else previous.count += 1;
  next();
}

const ensureDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'MongoDB is not connected. Set MONGODB_URI in .env and restart the server.' });
  next();
};

function signature(payload) { return createHmac('sha256', process.env.ADMIN_PASSCODE || 'unconfigured').update(payload).digest('base64url'); }
function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}
function validToken(value = '') {
  const [payload, received] = value.split('.');
  if (!payload || !received || !process.env.ADMIN_PASSCODE) return false;
  const expected = signature(payload);
  const a = Buffer.from(received); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
function requireAdmin(req, res, next) {
  if (!validToken((req.get('authorization') || '').replace(/^Bearer\s+/i, ''))) return res.status(401).json({ error: 'Sign in to manage club records.' });
  next();
}

app.get('/', (_req, res) => {
  const groupsByName = [...new Set(apiEndpoints.map(endpoint => endpoint.group))];
  const sections = groupsByName.map(group => `
    <section class="group"><h2>${group}</h2><div class="routes">${apiEndpoints.filter(endpoint => endpoint.group === group).map(endpoint => {
      const href = endpoint.path.includes(':') ? '#' : endpoint.path;
      return `<article class="route"><span class="method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span><a href="${href}">${endpoint.path}</a><span class="access access-${endpoint.access.toLowerCase()}">${endpoint.access}</span><p>${endpoint.purpose}</p></article>`;
    }).join('')}</div></section>`).join('');
  res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blood Network API</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#18283c;font:15px/1.5 'Segoe UI',Arial,sans-serif}.page{max-width:1040px;margin:0 auto;padding:40px 22px 70px}.hero{padding:30px 32px;border-radius:14px;background:linear-gradient(125deg,#14253d,#203e63);color:#fff;box-shadow:0 12px 30px #14253d20}.eyebrow{color:#f6a6ad;text-transform:uppercase;letter-spacing:1.2px;font-size:11px;font-weight:800}.hero h1{margin:8px 0;font-size:32px;line-height:1.2}.hero p{margin:0;color:#d3dce8}.base{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:22px;padding:12px 14px;border:1px solid #ffffff2e;border-radius:8px;background:#ffffff12}.base code{overflow-wrap:anywhere;color:#fff}.base a{color:#fff;font-weight:700;text-decoration:none}.meta{display:flex;flex-wrap:wrap;gap:9px;margin:17px 0 28px}.meta a,.meta span{padding:7px 11px;border:1px solid #e2e7ee;border-radius:7px;background:#fff;color:#34516f;text-decoration:none;font-size:13px;font-weight:650}.group{margin-top:24px}.group h2{margin:0 0 10px;font-size:18px}.routes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.route{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px 10px;padding:14px;border:1px solid #e3e8ef;border-radius:9px;background:#fff}.route>a{min-width:0;color:#1c314b;font:600 12px/1.4 ui-monospace,Consolas,monospace;text-decoration:none;overflow-wrap:anywhere}.route>a:hover{text-decoration:underline}.route p{grid-column:2/-1;margin:0;color:#718095;font-size:12px}.method,.access{padding:4px 7px;border-radius:5px;font-size:10px;font-weight:800;letter-spacing:.25px}.method-get{background:#e9f5ef;color:#18734a}.method-post{background:#eaf1ff;color:#255db1}.method-put,.method-patch{background:#fff3df;color:#976300}.access{background:#eff2f6;color:#5e6e80}.access-admin{background:#fff0f1;color:#ad1c32}.foot{margin-top:22px;color:#8190a1;font-size:12px}@media(max-width:650px){.page{padding:20px 13px 40px}.hero{padding:22px 18px}.hero h1{font-size:26px}.base{align-items:flex-start;flex-direction:column}.routes{grid-template-columns:1fr}}
    </style></head><body><main class="page"><header class="hero"><span class="eyebrow">Poongurichi Nanbargal</span><h1>Blood Network API</h1><p>API reference for the public website and coordinator CRM.</p><div class="base"><code>Base URL: ${`http://${_req.get('host') || `localhost:${port}`}`}/api</code><a href="/api">Open JSON index →</a></div></header><nav class="meta"><a href="/api/health">API health</a><a href="/api/public/homepage">Published homepage</a></nav>${sections}<p class="foot">Admin routes require a Bearer token from <code>POST /api/auth/login</code>. Replace <code>:id</code> with the MongoDB record ID.</p></main></body></html>`);
});
app.get('/api', (_req, res) => res.json({
  name: 'Poongurichi Blood Network API',
  version: '1.0',
  baseUrl: `http://${_req.get('host') || `localhost:${port}`}/api`,
  documentation: `http://${_req.get('host') || `localhost:${port}`}/`,
  health: '/api/health',
  authentication: { type: 'Bearer token', login: 'POST /api/auth/login', protectedAccess: 'Admin CRM endpoints' },
  endpoints: apiEndpoints,
}));
app.get('/api/health', (_req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', authConfigured: Boolean(process.env.ADMIN_PASSCODE) }));
app.post('/api/auth/login', (req, res) => {
  if (!process.env.ADMIN_PASSCODE) return res.status(503).json({ error: 'Set ADMIN_PASSCODE in .env before connecting the CRM.' });
  const provided = String(req.body?.passcode || '');
  const expected = Buffer.from(process.env.ADMIN_PASSCODE);
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return res.status(401).json({ error: 'That passcode was not recognized.' });
  res.json({ token: issueToken(), expiresIn: 8 * 60 * 60 });
});

app.get('/api/public/donors', ensureDb, async (req, res, next) => {
  try {
    const query = { available: true, publicListing: true };
    if (req.query.group && groups.includes(req.query.group)) query.bloodGroup = req.query.group;
    if (req.query.area) {
      const term = String(req.query.area).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['name', 'area'].map(key => ({ [key]: { $regex: term, $options: 'i' } }));
    }
    const donors = await Donor.find(query).select('name bloodGroup area phone available createdAt').sort({ createdAt: -1 }).limit(100).lean();
    res.json(donors);
  } catch (error) { next(error); }
});
app.get('/api/public/featured-donors', ensureDb, async (_req, res, next) => {
  try {
    const donors = await Donor.find({ available: true, publicListing: true, featured: true })
      .select('name bloodGroup area photo phone available createdAt').sort({ updatedAt: -1 }).limit(12).lean();
    res.json(donors);
  } catch (error) { next(error); }
});
app.post('/api/public/donors', limitPublicWrites, ensureDb, async (req, res, next) => {
  try {
    if (req.body.publicListing !== true) return res.status(400).json({ error: 'Donor listing consent is required.' });
    const donor = await Donor.create({
      name: req.body.name,
      phone: req.body.phone,
      bloodGroup: req.body.bloodGroup,
      area: req.body.area,
      photo: req.body.photo || '',
      available: true,
      publicListing: true,
      featured: Boolean(req.body.featured)
    });
    res.status(201).json(donor);
  } catch (error) { next(error); }
});
app.post('/api/public/requests', limitPublicWrites, ensureDb, async (req, res, next) => {
  try { res.status(201).json(await BloodRequest.create({ ...req.body, status: 'Open' })); } catch (error) { next(error); }
});

async function loadHomepageContent() {
  const saved = await HomepageContent.findOne({ key: 'public-homepage' }).lean();
  if (!saved) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [registeredDonors, availableDonors, requestsServed, eventsOrganized, groupTotals, latestRequest, latestEvent] = await Promise.all([
    Donor.countDocuments(),
    Donor.countDocuments({ available: true }),
    BloodRequest.countDocuments({ status: 'Fulfilled' }),
    Event.countDocuments({ status: 'Completed' }),
    Donor.aggregate([{ $group: { _id: '$bloodGroup', count: { $sum: 1 } } }]),
    BloodRequest.findOne({ status: { $in: ['Open', 'In progress'] } }).select('hospital patient bloodGroup units urgency requestedAt status').sort({ requestedAt: -1 }).lean(),
    Event.findOne({ status: 'Upcoming', date: { $gte: today } }).select('title date location description status image').sort({ date: 1 }).lean(),
  ]);
  const liveGroups = Object.fromEntries(groupTotals.map(({ _id, count }) => [_id, count]));
  return {
    ...saved,
    latestRequest: latestRequest || null,
    latestEvent: latestEvent || null,
    groupCounts: groups.map(group => ({ group, count: liveGroups[group] || 0 })),
    stats: {
      ...saved.stats,
      registeredDonors: registeredDonors > 0 ? registeredDonors : (saved.stats?.registeredDonors || 33),
      availableDonors: availableDonors > 0 ? availableDonors : (saved.stats?.availableDonors || 28),
      requestsServed: requestsServed > 0 ? requestsServed : (saved.stats?.requestsServed || 5),
      eventsOrganized: eventsOrganized > 0 ? eventsOrganized : (saved.stats?.eventsOrganized || (saved.latestEvent ? 1 : 0) || 1),
      bloodGroupsCovered: groupTotals.length > 0 ? groupTotals.length : (saved.stats?.bloodGroupsCovered || 8),
    },
  };
}

app.get('/api/public/homepage', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Homepage content is unavailable until MongoDB connects.' });
  try {
    const content = await loadHomepageContent();
    return content ? res.json(content) : res.status(404).json({ error: 'Homepage content has not been published.' });
  } catch (error) { next(error); }
});

app.get('/api/public/requests', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.json([]);
  try {
    const requests = await BloodRequest.find({ status: { $in: ['Open', 'In progress'] } })
      .select('hospital patient bloodGroup units urgency requestedAt status')
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();
    res.json(requests);
  } catch (error) { next(error); }
});

app.get('/api/public/events', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Events are unavailable until MongoDB connects.' });
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const events = await Event.find({ status: 'Upcoming', date: { $gte: today } })
      .select('title date location description status image')
      .sort({ date: 1 })
      .limit(12)
      .lean();
    res.json(events);
  } catch (error) { next(error); }
});
app.get('/api/public/media/:id', ensureDb, async (req, res, next) => {
  try {
    const asset = await MediaAsset.findById(req.params.id).select('contentType data').lean();
    if (!asset) return res.status(404).end();
    res.set('Content-Type', asset.contentType).set('Cache-Control', 'public, max-age=86400').send(asset.data);
  } catch (error) { next(error); }
});
app.post('/api/media', requireAdmin, ensureDb, uploadImage.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });
    const originalSize = req.file.buffer.length;
    const { data, contentType, fileName } = await compressImageBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    const asset = await MediaAsset.create({
      fileName,
      contentType,
      data,
    });
    const compressedSize = data.length;
    res.status(201).json({
      url: `/api/public/media/${asset._id}`,
      id: asset._id,
      fileName: asset.fileName,
      originalSize,
      compressedSize,
      savings: originalSize > 0 ? `${Math.round((1 - compressedSize / originalSize) * 100)}%` : '0%',
    });
  } catch (error) { next(error); }
});

app.get('/api/homepage/content', requireAdmin, ensureDb, async (_req, res, next) => {
  try {
    const content = await loadHomepageContent();
    return content ? res.json(content) : res.status(404).json({ error: 'Homepage content has not been published.' });
  } catch (error) { next(error); }
});

app.put('/api/homepage/content', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const { translations, groupCounts, stats, sections, images, phone, contacts, socials, siteName, siteSubtitle, region, developerName, developerPhone } = req.body || {};
    if (!translations || typeof translations !== 'object' || !translations.en || !translations.ta) {
      return res.status(400).json({ error: 'English and Tamil homepage content are required.' });
    }
    const saved = await HomepageContent.findOneAndUpdate(
      { key: 'public-homepage' },
      { $set: { translations, groupCounts, stats, sections, images, phone: String(phone || '').slice(0, 40), contacts, socials, siteName, siteSubtitle, region, developerName, developerPhone } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(saved);
  } catch (error) { next(error); }
});

app.get('/api/dashboard', requireAdmin, ensureDb, async (_req, res, next) => {
  try {
    const [totalDonors, activeDonors, openRequests, events, groupCounts, recentRequests] = await Promise.all([
      Donor.countDocuments(), Donor.countDocuments({ available: true }),
      BloodRequest.countDocuments({ status: { $in: ['Open', 'In progress'] } }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      Donor.aggregate([{ $group: { _id: '$bloodGroup', count: { $sum: 1 } } }]),
      BloodRequest.find().sort({ requestedAt: -1 }).limit(5).lean(),
    ]);
    const byGroup = Object.fromEntries(groupCounts.map(({ _id, count }) => [_id, count]));
    res.json({ totalDonors, activeDonors, openRequests, events, bloodGroups: groups.map(group => ({ group, count: byGroup[group] || 0 })), recentRequests });
  } catch (error) { next(error); }
});

app.get('/api/donors', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const query = {};
    if (req.query.group && groups.includes(req.query.group)) query.bloodGroup = req.query.group;
    if (req.query.search) query.$or = ['name', 'area', 'phone'].map(key => ({ [key]: { $regex: req.query.search, $options: 'i' } }));
    res.json(await Donor.find(query).sort({ createdAt: -1 }).limit(250).lean());
  } catch (error) { next(error); }
});
app.post('/api/donors', requireAdmin, ensureDb, async (req, res, next) => {
  try { res.status(201).json(await Donor.create(req.body)); } catch (error) { next(error); }
});
app.patch('/api/donors/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return donor ? res.json(donor) : res.status(404).json({ error: 'Donor not found' });
  } catch (error) { next(error); }
});
app.delete('/api/donors/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    return donor ? res.json({ deleted: true, id: donor._id }) : res.status(404).json({ error: 'Donor not found' });
  } catch (error) { next(error); }
});

app.get('/api/requests', requireAdmin, ensureDb, async (_req, res, next) => {
  try { res.json(await BloodRequest.find().sort({ requestedAt: -1 }).limit(250).lean()); } catch (error) { next(error); }
});
app.post('/api/requests', requireAdmin, ensureDb, async (req, res, next) => {
  try { res.status(201).json(await BloodRequest.create(req.body)); } catch (error) { next(error); }
});
app.patch('/api/requests/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return request ? res.json(request) : res.status(404).json({ error: 'Request not found' });
  } catch (error) { next(error); }
});
app.delete('/api/requests/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const request = await BloodRequest.findByIdAndDelete(req.params.id);
    return request ? res.json({ deleted: true, id: request._id }) : res.status(404).json({ error: 'Request not found' });
  } catch (error) { next(error); }
});

app.get('/api/events', requireAdmin, ensureDb, async (_req, res, next) => {
  try { res.json(await Event.find().sort({ date: 1 }).limit(250).lean()); } catch (error) { next(error); }
});
app.post('/api/events', requireAdmin, ensureDb, async (req, res, next) => {
  try { res.status(201).json(await Event.create(req.body)); } catch (error) { next(error); }
});
app.patch('/api/events/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    return event ? res.json(event) : res.status(404).json({ error: 'Event not found' });
  } catch (error) { next(error); }
});
app.delete('/api/events/:id', requireAdmin, ensureDb, async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    return event ? res.json({ deleted: true, id: event._id }) : res.status(404).json({ error: 'Event not found' });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Images must be 5 MB or smaller.' });
  if (error.message?.startsWith('Upload a JPG')) return res.status(400).json({ error: error.message });
  if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
  if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid record identifier' });
  console.error(error);
  res.status(500).json({ error: 'Something went wrong while saving this record.' });
});

async function connectMongoWithRetry(delayMs = 5000) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
  } catch (error) {
    const nextDelay = Math.min(delayMs * 2, 30000);
    console.error(`MongoDB connection failed; retrying in ${Math.round(delayMs / 1000)}s. Check the Atlas IP access list and database user settings. ${error.message}`);
    const retry = setTimeout(() => connectMongoWithRetry(nextDelay), delayMs);
    retry.unref();
  }
}

const apiServer = app.listen(port);
apiServer.on('listening', () => {
  console.log(`Blood network API listening on port ${port}`);
  if (process.env.MONGODB_URI) {
    connectMongoWithRetry();
  } else {
    console.warn('MongoDB is not configured. Copy .env.example to .env and set MONGODB_URI to enable persistent CRM data.');
  }
});
apiServer.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[backend] Port ${port} is already in use.`);
    console.error(`[backend] Check the existing API at http://localhost:${port}/api/health.`);
    console.error('[backend] Stop the existing app process before starting another backend copy.');
  } else {
    console.error('[backend] Could not start the API:', error.message);
  }
  process.exitCode = 1;
});
