"""
PostgreSQL (Neon) access for NESTR.

Set DATABASE_URL to your Neon connection string (use the pooled "transaction" URI
from the Neon dashboard for serverless hosts like Render).
"""
from __future__ import annotations

import os
from contextlib import contextmanager

try:
	from dotenv import load_dotenv

	_load_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
	load_dotenv(_load_env_path)
except ImportError:
	pass
import ssl
from typing import Any, List, Optional, Sequence
from urllib.parse import parse_qs, urlparse

import pg8000
import queue

_pool = queue.Queue()

def _create_new_connection():
	dsn = get_dsn()
	parsed = urlparse(dsn)
	query = parse_qs(parsed.query)
	sslmode = (query.get("sslmode", ["require"])[0] or "require").lower()
	ssl_ctx = None
	if sslmode in ("require", "verify-ca", "verify-full"):
		ssl_ctx = ssl.create_default_context()
	port = int(parsed.port or 5432)
	return pg8000.connect(
		user=parsed.username,
		password=parsed.password,
		host=parsed.hostname,
		port=port,
		database=(parsed.path or "/neondb").lstrip("/"),
		ssl_context=ssl_ctx,
	)

def get_pooled_connection():
	while True:
		try:
			conn = _pool.get_nowait()
			try:
				with conn.cursor() as cur:
					cur.execute("SELECT 1")
				return conn
			except Exception:
				try:
					conn.close()
				except Exception:
					pass
		except queue.Empty:
			return _create_new_connection()


def _normalize_dsn(url: str) -> str:
	if url.startswith("postgres://"):
		return url.replace("postgres://", "postgresql://", 1)
	return url


def get_dsn() -> str:
	dsn = os.environ.get("DATABASE_URL", "").strip()
	if not dsn:
		raise RuntimeError(
			"DATABASE_URL is not set. Add your Neon connection string to the environment."
		)
	return _normalize_dsn(dsn)


@contextmanager
def get_connection():
	conn = get_pooled_connection()
	try:
		yield conn
	finally:
		if conn:
			try:
				conn.rollback() # Ensure no pending transactions
				_pool.put_nowait(conn)
			except Exception:
				try:
					conn.close()
				except Exception:
					pass


def _rows_to_dicts(cur, rows):
	columns = [desc[0] for desc in cur.description]
	return [dict(zip(columns, row)) for row in rows]


def _row_to_dict(cur, row):
	if row is None:
		return None
	columns = [desc[0] for desc in cur.description]
	return dict(zip(columns, row))


def init_schema(conn) -> None:
	with conn.cursor() as cur:
		cur.execute(
			"""
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				name TEXT,
				email TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				role TEXT,
				phone TEXT,
				created_at DATE
			);
			"""
		)
		cur.execute(
			"""
			CREATE TABLE IF NOT EXISTS properties (
				id SERIAL PRIMARY KEY,
				title TEXT,
				description TEXT,
				price INTEGER,
				type TEXT,
				bedrooms INTEGER,
				bathrooms INTEGER,
				state TEXT,
				city TEXT,
				area TEXT,
				address TEXT,
				landlord_id INTEGER REFERENCES users(id),
				landlord_name TEXT,
				contact TEXT,
				created_at DATE,
				status TEXT DEFAULT 'available',
				views INTEGER DEFAULT 0
			);
			"""
		)
		cur.execute(
			"""
			CREATE TABLE IF NOT EXISTS images (
				id SERIAL PRIMARY KEY,
				property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
				filename TEXT
			);
			"""
		)
		cur.execute(
			"""
			CREATE TABLE IF NOT EXISTS likes (
				id SERIAL PRIMARY KEY,
				property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
				user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
				UNIQUE(property_id, user_id)
			);
			"""
		)
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic';")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_submitted';")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_doc_type TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_doc_id TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_notes TEXT;")
		cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;")

	conn.commit()





def fetch_all(sql: str, args: Sequence[Any] = ()) -> List[dict]:
	with get_connection() as conn:
		with conn.cursor() as cur:
			cur.execute(sql, tuple(args))
			rows = cur.fetchall()
			return _rows_to_dicts(cur, rows)


def fetch_one(sql: str, args: Sequence[Any] = ()) -> Optional[dict]:
	with get_connection() as conn:
		with conn.cursor() as cur:
			cur.execute(sql, tuple(args))
			row = cur.fetchone()
			return _row_to_dict(cur, row)


def execute(sql: str, args: Sequence[Any] = ()) -> None:
	with get_connection() as conn:
		with conn.cursor() as cur:
			cur.execute(sql, tuple(args))
		conn.commit()


def insert_returning_id(sql: str, args: Sequence[Any] = ()) -> int:
	"""Run INSERT ... RETURNING id and return the new primary key."""
	with get_connection() as conn:
		with conn.cursor() as cur:
			cur.execute(sql, tuple(args))
			row = _row_to_dict(cur, cur.fetchone())
		conn.commit()
		if not row or "id" not in row:
			raise RuntimeError("insert_returning_id: query must RETURN id")
		return int(row["id"])

