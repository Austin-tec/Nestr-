"""
SMTP email helpers for OTP / verification (stdlib only).
Set SMTP_HOST and related env vars to deliver mail; otherwise the API falls back to dev mode.
"""

from __future__ import annotations

import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
	return bool(os.environ.get("SMTP_HOST", "").strip())


def send_verification_otp(to_email: str, code: str, name: str = "") -> None:
	"""
	Send a one-time verification code. Raises on SMTP failure when host is configured.
	"""
	host = (os.environ.get("SMTP_HOST") or "").strip()
	if not host:
		raise RuntimeError("SMTP_HOST is not set")

	port = int(os.environ.get("SMTP_PORT") or "587")
	user = (os.environ.get("SMTP_USER") or "").strip()
	password = (os.environ.get("SMTP_PASSWORD") or "").strip()
	from_addr = (os.environ.get("SMTP_FROM") or os.environ.get("EMAIL_FROM") or user or "").strip()
	if not from_addr:
		raise RuntimeError("SMTP_FROM or SMTP_USER must be set")

	use_tls = (os.environ.get("SMTP_USE_TLS", "1").strip().lower() not in ("0", "false", "no"))
	subject = "Your NESTR verification code"
	greeting = f"Hi {name}," if name else "Hello,"
	body = (
		f"{greeting}\n\n"
		f"Your verification code is: {code}\n\n"
		"It expires when you request a new code.\n\n"
		"If you did not sign up for NESTR, you can ignore this email.\n"
	)

	msg = EmailMessage()
	msg["Subject"] = subject
	msg["From"] = from_addr
	msg["To"] = to_email
	msg.set_content(body)

	if use_tls:
		context = ssl.create_default_context()
		if port == 465:
			with smtplib.SMTP_SSL(host, port, timeout=30, context=context) as server:
				if user and password:
					server.login(user, password)
				server.send_message(msg)
		else:
			with smtplib.SMTP(host, port, timeout=30) as server:
				server.starttls(context=context)
				if user and password:
					server.login(user, password)
				server.send_message(msg)
	else:
		with smtplib.SMTP(host, port, timeout=30) as server:
			if user and password:
				server.login(user, password)
			server.send_message(msg)

	logger.info("Verification email sent to %s", to_email)
