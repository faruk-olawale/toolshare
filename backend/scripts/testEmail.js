const path = require('path');
const fs = require('fs');
const loc = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
require('dotenv').config({ path: loc.find(p => fs.existsSync(p)) });
const nodemailer = require('nodemailer');

async function run() {
  console.log('\n=== EMAIL CONFIG CHECK ===');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '❌ NOT SET'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ SET (' + process.env.EMAIL_PASS.length + ' chars)' : '❌ NOT SET'}`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n❌ Missing email credentials in .env — cannot test');
    process.exit(1);
  }

  console.log('\nTesting SMTP connection...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (err) {
    console.log(`❌ SMTP connection failed: ${err.message}`);
    console.log('\nCommon fixes:');
    console.log('1. Make sure EMAIL_PASS is a Gmail App Password (not your regular password)');
    console.log('2. Go to myaccount.google.com → Security → 2-Step Verification → App passwords');
    console.log('3. Generate a new app password for "Mail"');
    process.exit(1);
  }

  console.log('\nSending test email...');
  try {
    await transporter.sendMail({
      from: `ToolShare Africa <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '✅ ToolShare Email Test',
      html: '<h2>Email is working!</h2><p>Your ToolShare Africa email system is configured correctly.</p>',
    });
    console.log(`✅ Test email sent to ${process.env.EMAIL_USER} — check your inbox!`);
  } catch (err) {
    console.log(`❌ Failed to send: ${err.message}`);
  }
}
run();