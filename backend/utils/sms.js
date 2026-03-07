/**
 * SMS utility — uses Termii (popular in Nigeria) or logs if not configured
 * Set TERMII_API_KEY and TERMII_SENDER_ID in env to enable
 */
const sendSMS = async ({ to, message }) => {
  try {
    if (!process.env.TERMII_API_KEY) {
      console.log(`📱 SMS skipped (no TERMII_API_KEY): ${message.substring(0, 50)}... → ${to}`);
      return;
    }

    // Normalize Nigerian number
    let phone = to?.toString().replace(/\s/g, '');
    if (phone?.startsWith('0')) phone = '234' + phone.slice(1);
    if (phone?.startsWith('+')) phone = phone.slice(1);
    if (!phone) return;

    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        from: process.env.TERMII_SENDER_ID || 'ToolShare',
        sms: message,
        type: 'plain',
        api_key: process.env.TERMII_API_KEY,
        channel: 'generic',
      }),
    });

    const data = await response.json();
    console.log(`📱 SMS sent to ${phone}:`, data.message || 'OK');
  } catch (err) {
    console.error(`📱 SMS failed: ${err.message}`);
  }
};

module.exports = { sendSMS };