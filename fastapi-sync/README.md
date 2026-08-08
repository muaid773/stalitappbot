# Dish Align contact sync server

This is an intentionally small FastAPI receiver for the app's optional,
manual contact synchronization flow.

It does not save contacts to a database or file. It validates the request,
prints the received JSON to stdout, and returns the number of contacts
received.

## Run locally

```bash
cd fastapi-sync
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Use `http://<your-computer-ip>:8000/api/contacts` as the sync URL in the
Android app. A phone cannot reach `localhost` on the development computer.

## Optional request protection

Set `SYNC_TOKEN` on the server and send the same value as `X-Sync-Token`.
Do not put a private production token directly in the mobile app; use a
short-lived or user-specific token for a real deployment.