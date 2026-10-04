const path = require('node:path');
const dotenv = require('dotenv');
const { loadConfig } = require('../config');
const { createSmtpTransport } = require('../services/email');

async function verifySmtp() {
  let transporter;
  const deadline = setTimeout(() => {
    console.error('SMTP verification timed out. No email was sent.');
    transporter?.close();
    process.exit(1);
  }, 30000);
  try {
    // Use the same configuration as OTP delivery, without connecting to MongoDB.
    const backendDirectory = path.dirname(require.resolve('../package.json'));
    dotenv.config({ path: path.join(backendDirectory, '.env'), quiet: true });
    const config = loadConfig();
    if (config.email.mode !== 'smtp') {
      console.error('Set EMAIL_MODE=smtp to verify the SMTP connection.');
      process.exitCode = 1;
      return;
    }
    transporter = createSmtpTransport(config);
    await transporter.verify();
    console.log('SMTP connection and authentication succeeded. No email was sent.');
  } catch (error) {
    // Never print raw errors: they may include credentials or other environment values.
    const safeCodes = ['EAUTH', 'ESOCKET', 'ECONNECTION', 'ETIMEDOUT', 'EDNS'];
    const code = safeCodes.includes(error?.code) ? error.code : 'CONFIG_OR_CONNECTION_ERROR';
    const guidance = code === 'EAUTH'
      ? 'Check EMAIL_USER and its Google App Password in backend/.env.'
      : 'Check your SMTP configuration and certificate trust.';
    console.error(`SMTP verification failed (${code}). ${guidance}`);
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
    transporter?.close();
  }
}

verifySmtp();
