import os
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(
    title="Dish Align Contact Sync",
    description="Optional, user-triggered contact synchronization endpoint.",
    version="1.0.0",
)


class Contact(BaseModel):
    name: str = ""
    phones: List[str] = Field(default_factory=list)
    emails: List[str] = Field(default_factory=list)


class ContactSyncPayload(BaseModel):
    consent: bool
    source: str = "dish-aligner"
    sentAt: datetime
    contacts: List[Contact] = Field(default_factory=list)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/contacts")
def receive_contacts(
    payload: ContactSyncPayload,
    x_sync_token: Optional[str] = Header(default=None),
) -> dict[str, object]:
    """
    Receives contacts only after an explicit in-app sync action.

    Set SYNC_TOKEN in the server environment to require the matching
    X-Sync-Token header. The endpoint intentionally does not write to a
    database or a file; it prints the received payload and returns a count.
    """
    expected_token = os.getenv("SYNC_TOKEN")
    if expected_token and x_sync_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid sync token")

    if payload.consent is not True:
        raise HTTPException(
            status_code=400,
            detail="Explicit contact synchronization consent is required",
        )

    # Deliberately print only to the server's stdout. No persistence is used.
    print(payload.model_dump(mode="json"), flush=True)
    return {
        "received": len(payload.contacts),
        "stored": False,
        "message": "Contacts received and printed; nothing was stored.",
    }