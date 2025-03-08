# Mailrelay Helm Chart

This Helm chart deploys the Mailrelay Email Client and its optional dependencies on a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PV provisioner support in the underlying infrastructure
- Ingress controller (if ingress is enabled)

## Installing the Chart

1. Add the required Helm repositories:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add codecentric https://codecentric.github.io/helm-charts
helm repo update
```

2. Install the chart:

```bash
helm install mailrelay ./mailrelay
```

## Configuration

The following table lists the configurable parameters of the Mailrelay chart and their default values.

### Global Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.storageClass` | Global storage class for PVC | `standard` |

### Mailrelay Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mailrelay.image.repository` | Image repository | `starzeus/mailrelay-email-client` |
| `mailrelay.image.tag` | Image tag | `v1.7.0` |
| `mailrelay.replicaCount` | Number of replicas | `1` |
| `mailrelay.service.type` | Service type | `ClusterIP` |
| `mailrelay.service.uiPort` | UI service port | `3000` |
| `mailrelay.service.smtpPort` | SMTP service port | `2525` |
| `mailrelay.ingress.enabled` | Enable ingress | `true` |
| `mailrelay.ingress.className` | Ingress class name | `nginx` |

### Optional Dependencies

The chart includes several optional dependencies that can be enabled/disabled:

- PostgreSQL (enabled by default)
- Kafka (enabled by default)
- Kafka UI (enabled by default)
- MailHog (enabled by default)
- MockServer (enabled by default)

To disable any of these dependencies, set their respective `.enabled` value to `false` in your values file.

## Usage

1. Create a values.yaml file with your configuration:

```yaml
mailrelay:
  ingress:
    hosts:
      - host: mailrelay.example.com
        paths:
          - path: /
            pathType: Prefix

  secrets:
    nextauthSecret: "your-secret-key"
    oidcIssuerUrl: "your-oidc-issuer-url"
    oidcClientId: "your-client-id"
    oidcClientSecret: "your-client-secret"
    postgresUrl: "postgres://user:pass@host:5432/db"
```

2. Install the chart with your values:

```bash
helm install mailrelay ./mailrelay -f values.yaml
```

## Accessing the Application

After the chart is installed, follow the instructions displayed in the NOTES.txt output to access the application and its services.

## Uninstalling the Chart

To uninstall/delete the deployment:

```bash
helm delete mailrelay
```

## Development

To update dependencies:

```bash
helm dependency update
```

To package the chart:

```bash
helm package .
``` 