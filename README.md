# Mail Relay SMTP Client

A comprehensive email processing system that receives emails via SMTP, processes them according to configurable rules, and performs various actions based on those rules.

## Features

- SMTP server for receiving emails
- Web UI for managing emails and rules
- Rule-based email processing
- Multiple action types:
  - Forward emails
  - Send to webhook
  - Publish to Kafka
  - Execute JavaScript
  - Email relay with MJML/HTML templates

## Deployment Options

### Docker Compose

The easiest way to deploy the application is using Docker Compose:

1. Clone the repository
2. Navigate to the `hosting/docker` directory
3. Customize the `.env` file if needed
4. Run `docker-compose up -d`

This will start the following services:
- Mail Relay SMTP Client UI (Web UI + SMTP server)
- Mail Relay SMTP Server (SMTP server only)
- PostgreSQL database
- Kafka
- Kafka UI
- MailHog (for testing email sending)
- MockServer (for testing webhooks)

### Kubernetes

For production deployments, you can use the Helm chart:

1. Clone the repository
2. Navigate to the `hosting/k8s` directory
3. Customize the `values.yaml` file
4. Install the chart:
   ```
   helm install mailrelay ./
   ```

## Configuration

The application can be configured using environment variables:

- `APP_MODE`: Set to `smtp-client-ui` for the web UI + SMTP server, or `smtp` for SMTP server only
- `PORT`: Web UI port (default: 3000)
- `SMTP_SERVER_PORT`: SMTP server port (default: 2525)
- `POSTGRES_URL`: PostgreSQL connection string
- `KAFKA_BROKERS`: Comma-separated list of Kafka brokers

See the `.env` file for more configuration options.

## Development

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL
- (Optional) Kafka

### Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `pnpm dev`

## License

MIT
