const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const resend = new Resend(process.env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: 'LoreTrack Reports <onboarding@resend.dev>',
    to: supervisorEmail,
    subject: `LoreTrack Report — ${report.workerName} — ${report.date}`,
    text: `Worker: ${report.workerName}\nDate: ${report.date}\nTime: ${report.
