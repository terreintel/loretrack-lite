'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const path     = require('path');

const { transcribeAudio } = require('./services/transcription');
const { sendReport }      = require('./services/email');

const REQUIRED_VARS = [
  'GROQ_API_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];
const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`\n[LoreTrack Lite] Missing required environment variables:\n  ${missing.join(', ')}\n`);
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^audio\//.test(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: 'lite-1.0.0' });
});

/**
 * POST /api/upload
 * Pipeline: Groq Whisper → Nodemailer
 */
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    const {
      workerName      = '',
      supervisorEmail = '',
      timestamp       = '',
    } = req.body;

    if (!supervisorEmail) {
      return res.status(400).json({ error: 'supervisorEmail is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file received' });
    }

    const { buffer, mimetype, originalname } = req.file;
    console.log(`[upload] Worker: "${workerName}" | File: ${originalname} (${buffer.length} bytes)`);

    console.log('[upload] Transcribing…');
    const transcript = await transcribeAudio(buffer, originalname, mimetype);
    console.log(`[upload] Transcript: "${transcript.slice(0, 80)}…"`);

    const ts = timestamp ? new Date(Number(timestamp)) : new Date();
    const date = ts.toLocaleDateString('en-AU');
    const time = ts.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

    const report = { workerName, date, time, transcript };

    console.log(`[upload] Emailing report to ${supervisorEmail}…`);
    await sendReport(report, supervisorEmail);

    console.log('[upload] Done.');
    res.json({ transcript, report });

  } catch (err) {
    console.error('[upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🌿 LoreTrack Lite server running on http://localhost:${PORT}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);
});
