# Mail Relay Email Client

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/starzeus/mailrelay-email-client/docker-build.yml?branch=main&logo=github)](https://github.com/starzeus/mailrelay-email-client/actions)
[![Jest](https://img.shields.io/badge/Jest-Tested-C21325?logo=jest)](https://jestjs.io/)
[![Cypress](https://img.shields.io/badge/Cypress-Tested-17202C?logo=cypress)](https://www.cypress.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern email client with SMTP server capabilities and advanced email filtering rules.

## Features

- Next.js 15 web client for managing emails
- Built-in SMTP server for receiving emails
- Advanced email filtering rules with multiple action types:
  - Forward emails to another address
  - Send to webhook endpoints
  - Publish to Kafka topics
  - Execute custom JavaScript code
- Modern UI built with Tailwind CSS
- PostgreSQL database for email storage
- Docker support for easy deployment

## Prerequisites

- Node.js 20 or later
- PostgreSQL 16 or later
- Docker and Docker Compose (optional)
- pnpm package manager

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/starzeus/mailrelay-email-client.git
   cd mailrelay-email-client
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` with your configuration.

5. Initialize the database:
   ```bash
   pnpm db:migrate
   ```

## Running Locally

### Development Mode

```bash
# Run the Next.js client only
pnpm dev

# Run the SMTP server only
pnpm smtp

# Run both client and SMTP server
pnpm dev:all
```

### Production Mode

```bash
pnpm build
pnpm start
```

## Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. The services will be available at:
   - Web Client: http://localhost:3000
   - SMTP Server: localhost:2525

## Environment Variables

- `POSTGRES_URL`: PostgreSQL connection URL
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Enable/disable TLS
- `SMTP_USER`: SMTP authentication username
- `SMTP_PASS`: SMTP authentication password
- `SMTP_FROM`: Default "From" address
- `APP_MODE`: Run mode ('client', 'smtp', or 'both')
- `APP_PORT`: Web client port
- `SMTP_SERVER_PORT`: SMTP server port
- `KAFKA_BROKERS`: Kafka broker addresses
- `KAFKA_CLIENT_ID`: Kafka client identifier
- `JWT_SECRET`: JWT signing secret

## Authentication

This application supports OpenID Connect (OIDC) authentication. For detailed setup instructions, see [OIDC Setup Guide](docs/oidc-setup.md).

Supported OIDC providers:
- Auth0
- Okta
- Azure AD
- Any standard OIDC-compliant provider

## Email Filter Rules

1. Access the Filters & Actions section in the web client
2. Create rules with pattern matching for:
   - From address
   - To address
   - Subject
   - Body content
3. Configure actions:
   - Forward: Send to another email address
   - Webhook: Send to HTTP endpoint
   - Kafka: Publish to Kafka topic
   - JavaScript: Execute custom code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
