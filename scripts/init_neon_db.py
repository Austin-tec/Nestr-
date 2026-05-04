"""Apply schema + demo seed to Neon (uses .env DATABASE_URL)."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
	sys.path.insert(0, ROOT)

import database  # noqa: E402 — loads dotenv


def main() -> None:
	try:
		with database.get_connection() as conn:
			database.init_schema(conn)

	except Exception as e:
		print("Failed:", e)
		sys.exit(1)
	print("Database schema OK; seed ran if DB was empty.")


if __name__ == "__main__":
	main()
