import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '0.0.0.0',
  port: 2525,
  secure: false,
});

const testEmails = [
  {
    from: 'Sender <sender@important.com>',
    to: 'Recipient <recipient@test.com>',
    subject: '[IMPORTANT] kafka System Alert',
    text: 'This is a high priority system alert that requires immediate attention.',
    attachments: [{
      filename: 'alert.txt',
      content: 'Alert details and debug information'
    }]
  },
  {
    from: 'Sender <sender@gmail.com>',
    to: 'Orders <orders@gmail.com>',
    subject: 'New webhook #12345',
    text: 'A new order has been placed and needs processing.',
    attachments: [{
      filename: 'order.json',
      content: JSON.stringify({ orderId: 12345, items: ['item1', 'item2'] })
    }]
  },
  {
    from: 'user@gmail.com',
    to: 'support@gmail.com',
    subject: 'URGENT: Account Access Issue',
    text: 'I cannot access my account. Please help!',
  },
  {
    from: 'notifications@system.com',
    to: 'admin@company.com',
    subject: 'Daily System Report',
    text: 'Here is your daily system status report.',
    attachments: [{
      filename: 'report.csv',
      content: 'date,status,metric\n2024-02-20,OK,100'
    }]
  },
  {
    from: 'sender@gmail.com',
    to: 'subscribers@company.com',
    subject: 'Weekly webhook',
    text: 'Here are this week\'s top stories and updates.',
    attachments: [{
      filename: 'newsletter.html',
      content: '<h1>Newsletter</h1><p>Content here</p>'
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