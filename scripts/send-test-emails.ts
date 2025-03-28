import nodemailer from 'nodemailer';
import { Readable } from 'stream';

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
    html: `<h1>Monthly System Updates</h1>
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
      filename: 'data-customer.csv',
      content: Readable.from([
        'Column1,Column2,Column3,Column4\n',
        'Row1Col1,Row1Col2,Row1Col3,Row1Col4\n',
        'Row2Col1,Row2Col2,Row2Col3,Row2Col4\n',
        'Row3Col1,Row3Col2,Row3Col3,Row3Col4\n'
      ])
    },
    {
      filename: 'data-user.xlsx',
      content: Readable.from([
        'Id,Name,Zip Code,Last Name + First Name\n',
        'Row1Col1,Row1Col2,Row1Col3,Row1Col4\n',
        'Row2Col1,Row2Col2,Row2Col3,Row2Col4\n',
        'Row3Col1,Row3Col2,Row3Col3,Row3Col4\n'
      ])
    },
    {
      filename: 'data-user-tab.csv',
      content: Readable.from([
        'Id	Name	Zip Code	Last Name + First Name\n',
        'Row1Col1	Row1Col2	Row1Col3	Row1Col4\n',
        'Row2Col1	Row2Col2	Row2Col3	Row2Col4\n',
        'Row3Col1	Row3Col2	Row3Col3	Row3Col4\n'
      ])
    },    
    {
      filename: 'data-client.json',
      content: Readable.from([
        `[
          {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "bio": "John is a software engineer with over 10 years of experience in building scalable web applications. He specializes in TypeScript and Node.js.",
            "preferences": ["email", "sms"],
            "address": {
              "street": "123 Main St",
              "city": "Springfield",
              "state": "IL",
              "zip": "62701"
            }
          },
          {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "bio": "Jane is a product manager who loves working with cross-functional teams to deliver impactful products.",
            "preferences": ["email"],
            "address": {
              "street": "456 Elm St",
              "city": "Metropolis",
              "state": "NY",
              "zip": "10001"
            }
          },
          {
            "id": 3,
            "name": "Alice Johnson",
            "email": "alice.johnson@example.com",
            "bio": "Alice is a data scientist with expertise in machine learning and big data analytics.",
            "preferences": ["push", "email"],
            "address": {
              "street": "789 Oak St",
              "city": "Gotham",
              "state": "CA",
              "zip": "90210"
            }
          },
          {
            "id": 4,
            "name": "Bob Brown",
            "email": "bob.brown@example.com",
            "bio": "Bob is a UX designer passionate about creating intuitive and user-friendly interfaces.",
            "preferences": ["sms"],
            "address": {
              "street": "321 Pine St",
              "city": "Star City",
              "state": "TX",
              "zip": "73301"
            }
          }
        ]`
      ])
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