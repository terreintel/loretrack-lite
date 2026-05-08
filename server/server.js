const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

async function transcribeAudio(buffer, filename, mimeType) {
  const file = new File([buffer], filename, { type: mimeType });
  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text'
  });
  return transcription;
}

async function sendReport(report, supervisorEmail) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: supervisorEmail,
    subject: `LoreTrack Report — ${report.workerName} — ${report.date}`,
    text: `Worker: ${report.workerName}\nDate: ${report.date}\nTime: ${report.time}\n\n${report.transcript}`
  });
}

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    const { workerName, supervisorEmail, timestamp } = req.body;
    const { buffer, originalname, mimetype } = req.file;

    const transcript = await transcribeAudio(buffer, originalname, mimetype);

    const ts = timestamp ? new Date(Number(timestamp)) : new Date();
    const date = ts.toLocaleDateString('en-AU');
    const time = ts.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

    const report = { workerName, date, time, transcript };

    await sendReport(report, supervisorEmail);

    res.json({ transcript, report });
  } catch (err) {
    console.error('[upload] Error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`LoreTrack Lite server running on port ${PORT}`);
});
