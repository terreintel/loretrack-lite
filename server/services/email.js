'use strict';

const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPlainText({ workerName, date, time, transcript }) {
  return [
    `Worker: ${workerName || 'Unknown'}`,
    `Date:   ${date}`,
    `Time:   ${time}`,
    '',
    transcript || '',
  ].join('\n');
}

function buildHtml({ workerName, date, time, transcript }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1A1A1A}
  .meta{margin-bottom:18px;font-size:14px}
  .meta div{margin-bottom:4px}
  .label{color:#6B6B6B;display:inline-block;width:70px}
  .transcript{white-space:pre-wrap;font-size:15px;line-height:1.5}
</style>
</head>
<body>
  <div class="meta">
    <div><span class="label">Worker:</span> ${esc(workerName || 'Unknown')}</div>
    <div><span class="label">Date:</span> ${esc(date)}</div>
    <div><span class="label">Time:</span> ${esc(time)}</div>
  </div>
  <div class="transcript">${esc(transcript)}</div>
</body>
</html>`;
}

async function sendReport(report, supervisorEmail) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const workerName = report.workerName || 'Worker';

  await transporter.sendMail({
    from,
    to: supervisorEmail,
    subject: `LoreTrack Lite: ${workerName} – ${report.date}`,
    text: buildPlainText(report),
    html: buildHtml(report),
  });
}

module.exports = { sendReport };
