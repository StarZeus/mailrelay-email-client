import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '0.0.0.0',
  port: 2525,
  secure: false,
});

const testEmails = [
  {
    from: 'sender@hotmail.com',
    to: 'subscribers@company.com',
    subject: 'Monthly System Updates',
    text: `<h1>Monthly System Updates</h1>
        <p>Here are the key updates from this month:</p>
        
        <h2>New Features</h2>
        <ul>
          <li>Improved webhook reliability</li>
          <li>Added support for custom templates</li>
          <li>Enhanced error logging</li>
          <li>New API endpoints</li>
        </ul>

        <h2>System Performance</h2>
        <table border="1" cellpadding="5">
          <tr>
            <th>Metric</th>
            <th>Current</th>
            <th>Previous</th>
            <th>Change</th>
          </tr>
          <tr>
            <td>Response Time</td>
            <td>120ms</td>
            <td>150ms</td>
            <td>-20%</td>
          </tr>
          <tr>
            <td>Success Rate</td>
            <td>99.9%</td>
            <td>99.5%</td>
            <td>+0.4%</td>
          </tr>
          <tr>
            <td>Daily Requests</td>
            <td>250k</td>
            <td>200k</td>
            <td>+25%</td>
          </tr>
        </table>`,
    attachments: [{
      filename: 'newsletter.html',
      content: `<p>For more details, please visit our documentation.</p>
      `
    }]
  }
];

async function sendTestEmails() {
  console.log('Starting to send test emails...');
  
  for (const email of testEmails) {
    try {
      await transporter.sendMail(email);
      console.log(`✓ Sent email: ${email.subject}`);
      // Add a small delay between sends
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Failed to send email: ${email.subject}`, error);
    }
  }
  
  console.log('Finished sending test emails');
  process.exit(0);
}

sendTestEmails(); 