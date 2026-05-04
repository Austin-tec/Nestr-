"""Password hashing (bcrypt) and JWT access tokens for NESTR."""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

import bcrypt
import jwt


def _secret() -> str:
	key = (os.environ.get("JWT_SECRET_KEY") or os.environ.get("FLASK_SECRET_KEY") or "").strip()
	if key:
		return key
	# Local dev only; set JWT_SECRET_KEY in production
	return "nestr-dev-only-change-me"


def hash_password(plain: str) -> str:
	return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(4)).decode("utf-8")


def verify_password(plain: str, password_hash: str) -> bool:
	try:
		return bcrypt.checkpw(plain.encode("utf-8"), password_hash.encode("utf-8"))
	except Exception:
		return False


def create_access_token(user_id: int, extra_claims: Optional[Dict[str, Any]] = None) -> str:
	now = int(time.time())
	payload = {
		"sub": str(user_id),
		"iat": now,
		"exp": now + 7 * 24 * 3600,
		"type": "access",
	}
	if extra_claims:
		payload.update(extra_claims)
	return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_token(token: str) -> Optional[Dict[str, Any]]:
	try:
		return jwt.decode(token, _secret(), algorithms=["HS256"])
	except jwt.PyJWTError:
		return None
