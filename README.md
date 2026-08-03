# SBC-CMO-Wiremock-Mailer-Webhook

Small Express webhook service that accepts email payloads and forwards them to an SMTP server using Nodemailer.

## What This Service Does

- Exposes a `POST /send-email` endpoint.
- Accepts JSON payload with `to`, `subject`, and `body`.
- Sends an email through configured SMTP host/port.
- Uses sensible defaults if payload fields are missing.

## Docker Hub

The latest version of this app is available in Docker Hub as a downloadable image: https://hub.docker.com/r/marshallgraphics/sbc-cmo-wiremock-mailer-webhook

```
marshallgraphics/sbc-cmo-wiremock-mailer-webhook:latest
```

## Requirements

- Node.js 20+ (recommended)
- npm
- Reachable SMTP server (for local dev this is often MailHog on port `1025`)

## Environment Configuration

The app is configured entirely via environment variables.

| Variable    | Default               | Description                              |
| ----------- | --------------------- | ---------------------------------------- |
| `PORT`      | `4000`                | HTTP port the webhook server listens on. |
| `SMTP_HOST` | `mailhog`             | SMTP server hostname.                    |
| `SMTP_PORT` | `1025`                | SMTP server port.                        |
| `SMTP_FROM` | `wiremock@test.local` | Default `from` email address.            |

Notes:

- SMTP is configured with `secure: false` (non-TLS SMTP).
- If request payload omits fields, defaults are used:
    - `to`: `test@example.com`
    - `subject`: `WireMock event`
    - `body`: full JSON payload stringified

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. (Optional) Export environment variables:

```bash
export PORT=4000
export SMTP_HOST=localhost
export SMTP_PORT=1025
export SMTP_FROM=wiremock@test.local
```

3. Start the service:

```bash
npm start
```

The app will start on `http://localhost:4000` unless `PORT` is overridden.

## Run With Docker

Build image:

```bash
docker build -t sbc-cmo-wiremock-mailer-webhook .
```

Run container:

```bash
docker run --rm -p 4000:4000 \
	-e PORT=4000 \
	-e SMTP_HOST=host.docker.internal \
	-e SMTP_PORT=1025 \
	-e SMTP_FROM=wiremock@test.local \
	sbc-cmo-wiremock-mailer-webhook
```

Adjust `SMTP_HOST` depending on where your SMTP server is running (for example, `mailhog` if on the same Docker network).

## API Usage

### Endpoint

- `POST /send-email`
- `Content-Type: application/json`

### Example Request

```bash
curl -X POST http://localhost:4000/send-email \
	-H "Content-Type: application/json" \
	-d '{
		"to": "user@example.com",
		"subject": "WireMock test",
		"body": "Webhook event received"
	}'
```

### Example Response

```json
{
    "sent": true
}
```

## WireMock Webhook Example

Use the following WireMock mapping to intercept `POST /v3/transactionalSMS/send`, return a stubbed response, and trigger this service at `http://mailer:4000/send-email`.

```json
{
    "request": {
        "method": "POST",
        "url": "/v3/transactionalSMS/send"
    },
    "response": {
        "status": 200,
        "bodyFileName": "transactionalSMS.json",
        "headers": {
            "Content-Type": "application/json"
        }
    },
    "postServeActions": {
        "webhook": {
            "method": "POST",
            "url": "http://mailer:4000/send-email",
            "headers": {
                "Content-Type": "application/json"
            },
            "body": "{\"subject\":\"[SMS Intercepted] {{jsonPath originalRequest.body '$.organisationPrefix'}}\",\"body\":\"Sender: {{jsonPath originalRequest.body '$.sender'}}\\nRecipient: {{jsonPath originalRequest.body '$.recipient'}}\\nContent: {{jsonPath originalRequest.body '$.content'}}\\nType: {{jsonPath originalRequest.body '$.type'}}\"}"
        }
    }
}
```

### Notes for WireMock Setup

- Save this JSON as a mapping under your WireMock `mappings` directory.
- Ensure webhook extension support is enabled in your WireMock runtime.
- If you want template expressions (like `{{jsonPath ...}}`) rendered in webhook body content, enable response templating/global templating for your WireMock setup.
- The webhook payload in this example includes `subject` and `body`; this mailer will apply default values for any missing fields such as `to`.
