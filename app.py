import os
import secrets
import string
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, abort, g, url_for, Response
from flask_cors import CORS
import threading
import urllib.request
import urllib.error
import json

import auth_helpers
import database
import image_optimize
try:
	import email_notify
except ImportError:
	email_notify = None
try:
	import whatsapp_bot
except ImportError:
	whatsapp_bot = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "NESTR PROJECTS")
DATA_DIR = os.path.join(BASE_DIR, "data")
IMAGES_DIR = os.path.join(FRONTEND_DIR, "nestr images")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)


def init_db_on_startup():
	try:
		ensure_dirs()
		with database.get_connection() as conn:
			database.init_schema(conn)

	except Exception as e:
		print(f"Database initialization error: {e}")
		import traceback

		traceback.print_exc()


def ensure_dirs():
	try:
		os.makedirs(DATA_DIR, exist_ok=True)
		os.makedirs(IMAGES_DIR, exist_ok=True)
	except Exception as e:
		print(f"Warning: Could not create directories: {e}")


def user_public_dict(row):
	if not row:
		return None
	_hidden = {"password_hash", "email_verification_code"}
	return {k: row[k] for k in row if k not in _hidden}


def _generate_email_code():
	return "".join(secrets.choice(string.digits) for _ in range(6))


def _dispatch_new_verification_code(user_id):
	"""
	Generate OTP, store on user, and send asynchronously via SMTP to prevent synchronous web delays.
	"""
	row = database.fetch_one("SELECT id, email, name FROM users WHERE id = %s", (user_id,))
	if not row:
		raise ValueError("User not found")
	code = _generate_email_code()
	database.execute(
		"UPDATE users SET email_verification_code = %s WHERE id = %s",
		(code, user_id),
	)
	if email_notify and email_notify.smtp_configured():
		def async_send():
			try:
				email_notify.send_verification_otp(row["email"], code, row.get("name") or "")
			except Exception:
				pass
		threading.Thread(target=async_send).start()
		return {"email_sent": True, "dev": False, "code": None}
		
	return {"email_sent": False, "dev": True, "code": code}


def _refresh_verification_level(user_id):
	user = database.fetch_one(
		"SELECT email_verified, role, kyc_status FROM users WHERE id = %s",
		(user_id,),
	)
	if not user:
		return
	level = "basic"
	if user.get("email_verified"):
		level = "verified"
	if (
		user.get("role") == "landlord"
		and user.get("email_verified")
		and user.get("kyc_status") == "approved"
	):
		level = "solid"
	database.execute("UPDATE users SET verification_level = %s WHERE id = %s", (level, user_id))


def _require_verified_landlord(user):
	if user.get("role") != "landlord":
		return jsonify({"error": "Only landlords can perform this action"}), 403
	if not user.get("email_verified"):
		return jsonify({"error": "Verify your email before posting or managing listings"}), 403
	return None


@app.teardown_appcontext
def close_connection(exception):
	pass


@app.errorhandler(Exception)
def handle_unexpected_error(e):
	app.logger.exception("Unhandled exception")
	return jsonify({"error": "Internal server error", "message": str(e)}), 500


@app.route("/")
def serve_index():
	index_path = os.path.join(FRONTEND_DIR, "index.html")
	if os.path.exists(index_path):
		return send_from_directory(FRONTEND_DIR, "index.html")
	return "Frontend not found", 404


@app.route("/<path:path>")
def serve_static(path):
	full = os.path.join(FRONTEND_DIR, path)
	if os.path.exists(full):
		return send_from_directory(FRONTEND_DIR, path)
	return abort(404)


def authenticate_request(req):
	auth = req.headers.get("Authorization") or req.args.get("token")
	if not auth:
		app.logger.debug("authenticate_request: no Authorization header or token param")
		return None
	if auth.lower().startswith("bearer "):
		token = auth.split(None, 1)[1]
	else:
		token = auth
	payload = auth_helpers.decode_token(token)
	if not payload or payload.get("type") != "access":
		app.logger.debug("authenticate_request: invalid or expired JWT")
		return None
	try:
		user_id = int(payload["sub"])
	except (KeyError, ValueError, TypeError):
		return None
	row = database.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
	return dict(row) if row else None


@app.route("/api/auth/register", methods=["POST"])
def api_register():
	data = request.get_json() or {}
	email = (data.get("email") or "").strip().lower()
	app.logger.debug("Register attempt for email: %s", email)
	try:
		name = data.get("name") or f"User{int(datetime.utcnow().timestamp())}"
		pwd = data.get("password") or ""
		if len(pwd) < 6:
			return jsonify({"error": "Password must be at least 6 characters"}), 400
		role = data.get("role") or "tenant"
		phone = data.get("phone") or ""
		created_at = datetime.utcnow().strftime("%Y-%m-%d")
		pw_hash = auth_helpers.hash_password(pwd)
		
		with database.get_connection() as conn:
			with conn.cursor() as cur:
				cur.execute("SELECT id FROM users WHERE lower(email) = lower(%s)", (email,))
				if cur.fetchone():
					return jsonify({"error": "User with this email already exists"}), 400
				
				cur.execute(
					"""
					INSERT INTO users (name, email, password_hash, role, phone, created_at, email_verified, verification_level, kyc_status)
					VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
					RETURNING *
					""",
					(name, email, pw_hash, role, phone, created_at, False, "basic", "not_submitted")
				)
				user_row = cur.fetchone()
				columns = [desc[0] for desc in cur.description]
				user = dict(zip(columns, user_row))
			conn.commit()
			
		uid = user["id"]
		token = auth_helpers.create_access_token(uid)
		app.logger.debug("Register success for email %s id %s", email, uid)
		
		def async_dispatch(user_id):
			with app.app_context():
				try:
					_dispatch_new_verification_code(user_id)
				except Exception as e:
					app.logger.warning("Async dispatch failed: %s", e)
		
		threading.Thread(target=async_dispatch, args=(uid,), daemon=True).start()
		
		vb = {"email_sent": True, "dev": False}
		return jsonify({"user": user_public_dict(user), "token": token, "verification": vb})
	except Exception as e:
		app.logger.exception("Registration error for %s", email)
		return jsonify({"error": "Registration failed", "message": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
def api_login():
	data = request.get_json() or {}
	email = (data.get("email") or "").strip().lower()
	pwd = data.get("password") or ""
	app.logger.debug("Login attempt for email: %s", email)
	try:
		user = database.fetch_one(
			"SELECT * FROM users WHERE lower(email) = lower(%s)",
			(email,),
		)
		if not user or not auth_helpers.verify_password(pwd, user["password_hash"]):
			app.logger.debug("Login failed for email %s: invalid credentials", email)
			return jsonify({"error": "Invalid credentials"}), 401
		uid = user["id"]
		token = auth_helpers.create_access_token(uid)
		app.logger.debug("Login success for email %s id %s", email, uid)
		return jsonify({"user": user_public_dict(user), "token": token})
	except Exception as e:
		app.logger.exception("Login error for %s", email)
		return jsonify({"error": "Login failed", "message": str(e)}), 500


@app.route("/api/users/me", methods=["GET"])
def api_me():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	return jsonify({"user": user_public_dict(user)})


@app.route("/api/auth/request-email-verification", methods=["POST"])
def api_request_email_verification():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	if user.get("email_verified"):
		return jsonify({"message": "Email already verified", "already_verified": True})
	try:
		meta = _dispatch_new_verification_code(user["id"])
	except Exception as e:
		app.logger.exception("request-email-verification failed")
		return jsonify({"error": "Could not send verification email", "message": str(e)}), 500
	out = {
		"message": "Verification code sent to your email."
		if meta.get("email_sent")
		else "Verification code ready (dev mode — check API or configure SMTP).",
		"email_sent": bool(meta.get("email_sent")),
		"dev": bool(meta.get("dev")),
	}
	if meta.get("code"):
		out["code"] = meta["code"]
	return jsonify(out)


@app.route("/api/auth/verify-email", methods=["POST"])
def api_verify_email():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	data = request.get_json() or {}
	code = (data.get("code") or "").strip()
	if not code:
		return jsonify({"error": "Verification code is required"}), 400
	
	try:
		with database.get_connection() as conn:
			with conn.cursor() as cur:
				cur.execute(
					"UPDATE users SET email_verified = TRUE, email_verification_code = NULL WHERE id = %s AND email_verification_code = %s RETURNING role, kyc_status",
					(user["id"], code)
				)
				row = cur.fetchone()
				if not row:
					return jsonify({"error": "Invalid verification code"}), 400
				
				role, kyc_status = row
				level = "verified"
				if role == "landlord" and kyc_status == "approved":
					level = "solid"
				
				cur.execute("UPDATE users SET verification_level = %s WHERE id = %s RETURNING *", (level, user["id"]))
				updated_row = cur.fetchone()
				columns = [desc[0] for desc in cur.description]
				updated = dict(zip(columns, updated_row))
			conn.commit()
			
		return jsonify({"message": "Email verified", "user": user_public_dict(updated)})
	except Exception as e:
		app.logger.exception("Verify email error")
		return jsonify({"error": "Failed to verify. Database timeout."}), 500


@app.route("/api/landlord/kyc/submit", methods=["POST"])
def api_submit_kyc():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	if user.get("role") != "landlord":
		return jsonify({"error": "Only landlords can submit KYC"}), 403
	data = request.get_json() or {}
	doc_type = (data.get("doc_type") or "").strip()
	doc_id = (data.get("doc_id") or "").strip()
	if not doc_type or not doc_id:
		return jsonify({"error": "doc_type and doc_id are required"}), 400
	now = datetime.utcnow().isoformat()
	database.execute(
		"""
		UPDATE users
		SET kyc_status = %s, kyc_doc_type = %s, kyc_doc_id = %s, kyc_submitted_at = %s, verification_notes = %s
		WHERE id = %s
		""",
		("pending", doc_type, doc_id, now, "KYC submitted. Awaiting review.", user["id"]),
	)
	_refresh_verification_level(user["id"])
	updated = database.fetch_one("SELECT * FROM users WHERE id = %s", (user["id"],))
	return jsonify({"message": "KYC submitted", "user": user_public_dict(updated)})


@app.route("/api/landlord/kyc/status", methods=["GET"])
def api_kyc_status():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	if user.get("role") != "landlord":
		return jsonify({"error": "Only landlords can view KYC status"}), 403
	return jsonify(
		{
			"kyc_status": user.get("kyc_status"),
			"verification_level": user.get("verification_level"),
			"email_verified": user.get("email_verified"),
			"verification_notes": user.get("verification_notes"),
		}
	)


@app.route("/api/admin/kyc/review", methods=["POST"])
def api_admin_kyc_review():
	admin_key = os.environ.get("KYC_ADMIN_KEY", "").strip()
	provided = request.headers.get("X-Admin-Key", "").strip()
	if not admin_key or provided != admin_key:
		return jsonify({"error": "Unauthorized admin action"}), 401
	data = request.get_json() or {}
	user_id = data.get("user_id")
	status = (data.get("status") or "").strip().lower()
	notes = (data.get("notes") or "").strip()
	if not user_id or status not in ("approved", "rejected", "pending"):
		return jsonify({"error": "user_id and valid status required"}), 400
	now = datetime.utcnow().isoformat()
	database.execute(
		"UPDATE users SET kyc_status = %s, kyc_reviewed_at = %s, verification_notes = %s WHERE id = %s",
		(status, now, notes, user_id),
	)
	_refresh_verification_level(int(user_id))
	updated = database.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
	return jsonify({"message": "KYC reviewed", "user": user_public_dict(updated)})


@app.route("/api/debug/whoami", methods=["GET"])
def api_debug_whoami():
	auth_header = request.headers.get("Authorization")
	user = authenticate_request(request)
	user_out = user_public_dict(user) if user else None
	return jsonify({"authorization_header": auth_header, "user": user_out})


def build_property_dict(row, cur=None):
	p = dict(row)
	if cur:
		cur.execute("SELECT filename FROM images WHERE property_id = %s", (p["id"],))
		p["images"] = [i[0] for i in cur.fetchall()]
		cur.execute("SELECT user_id FROM likes WHERE property_id = %s", (p["id"],))
		p["likes"] = [l[0] for l in cur.fetchall()]
	else:
		imgs = database.fetch_all("SELECT filename FROM images WHERE property_id = %s", (p["id"],))
		p["images"] = [i["filename"] for i in imgs]
		likes = database.fetch_all("SELECT user_id FROM likes WHERE property_id = %s", (p["id"],))
		p["likes"] = [l["user_id"] for l in likes]
	return p


@app.route("/api/properties", methods=["GET"])
def api_get_properties():
	args = request.args
	props = []
	try:
		with database.get_connection() as conn:
			with conn.cursor() as cur:
				cur.execute("SELECT * FROM properties")
				rows = cur.fetchall()
				if rows:
					cols = [desc[0] for desc in cur.description]
					props_map = {r[0]: dict(zip(cols, r)) for r in rows}
					for p in props_map.values():
						p["images"], p["likes"] = [], []
					cur.execute("SELECT property_id, filename FROM images")
					for rp_id, fname in cur.fetchall():
						if rp_id in props_map: props_map[rp_id]["images"].append(fname)
					cur.execute("SELECT property_id, user_id FROM likes")
					for rp_id, uid in cur.fetchall():
						if rp_id in props_map: props_map[rp_id]["likes"].append(uid)
					props = list(props_map.values())
	except Exception as e:
		app.logger.exception("Bulk properties load failed")

	q = (args.get("search") or "").strip()
	if q:
		ql = q.lower()
		props = [
			p
			for p in props
			if ql
			in (
				p.get("title", "").lower()
				+ p.get("description", "").lower()
				+ p.get("area", "").lower()
				+ p.get("city", "").lower()
				+ p.get("state", "").lower()
				+ p.get("address", "").lower()
			)
		]
	state = (args.get("state") or "").strip()
	if state and state != "all":
		props = [p for p in props if (p.get("state") or "").strip().lower() == state.lower()]
	city = (args.get("city") or "").strip()
	if city and city != "all":
		props = [p for p in props if (p.get("city") or "").strip().lower() == city.lower()]
	area = (args.get("area") or "").strip()
	if area and area != "all":
		props = [p for p in props if area.lower() in (p.get("area") or "").lower()]
	ptype = (args.get("type") or "").strip()
	if ptype and ptype != "all":
		props = [p for p in props if (p.get("type") or "").strip().lower() == ptype.lower()]
	try:
		minp = int(args.get("minPrice")) if args.get("minPrice") else None
		maxp = int(args.get("maxPrice")) if args.get("maxPrice") else None
	except Exception:
		minp = maxp = None
	if minp is not None:
		props = [p for p in props if p.get("price", 0) >= minp]
	if maxp is not None:
		props = [p for p in props if p.get("price", 0) <= maxp]
	try:
		beds = int(args.get("bedrooms")) if args.get("bedrooms") else None
	except Exception:
		beds = None
	if beds is not None:
		props = [p for p in props if p.get("bedrooms", 0) >= beds]
	return jsonify({"properties": props})


@app.route("/api/properties/<int:pid>", methods=["GET"])
def api_get_property(pid):
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	if not row:
		return jsonify({"error": "Not found"}), 404
	database.execute(
		"UPDATE properties SET views = views + 1 WHERE id = %s",
		(pid,),
	)
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	prop = build_property_dict(row)
	return jsonify({"property": prop})


@app.route("/api/properties", methods=["POST"])
def api_create_property():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	auth_error = _require_verified_landlord(user)
	if auth_error:
		return auth_error
		
	if not user.get("is_premium"):
		row = database.fetch_one(
			"SELECT COUNT(*) AS count FROM properties WHERE landlord_id = %s AND CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '7 days'",
			(user["id"],)
		)
		if row and row["count"] >= 5:
			return jsonify({"error": "You have reached your limit of 5 property postings per week. Upgrade your account to Premium to post more.", "requires_upgrade": True}), 403

	data = request.get_json() or {}
	created_at = datetime.utcnow().strftime("%Y-%m-%d")
	pid = database.insert_returning_id(
		"""
		INSERT INTO properties (
			title, description, price, type, bedrooms, bathrooms,
			state, city, area, address, landlord_id, landlord_name, contact,
			created_at, status, views
		) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
		RETURNING id
		""",
		(
			data.get("title", ""),
			data.get("description", ""),
			data.get("price", 0),
			data.get("type", ""),
			data.get("bedrooms", 0),
			data.get("bathrooms", 0),
			data.get("state", ""),
			data.get("city", ""),
			data.get("area", ""),
			data.get("address", ""),
			user["id"],
			user.get("name", ""),
			data.get("contact", user.get("phone", "")),
			created_at,
			"available",
			0,
		),
	)
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	return jsonify({"property": build_property_dict(row)}), 201

PAYSTACK_SECRET = "sk_test_61eae8df2a595aabdb4dbddb43db9b3ea348ec5d"

@app.route("/api/paystack/initialize", methods=["POST"])
def paystack_init():
	user = authenticate_request(request)
	if not user: return jsonify({"error": "Unauthorized"}), 401
	
	data = request.get_json() or {}
	plan = data.get("plan", "monthly")
	amount = 900000 if plan == "monthly" else 4500000
	
	payload = json.dumps({
		"email": user["email"],
		"amount": amount,
		"currency": "NGN",
		"callback_url": request.host_url.rstrip("/") + "/#verify-payment",
		"metadata": {"user_id": user["id"], "plan": plan}
	}).encode('utf-8')
	
	req = urllib.request.Request("https://api.paystack.co/transaction/initialize", data=payload)
	req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
	req.add_header("Content-Type", "application/json")
	
	try:
		with urllib.request.urlopen(req) as response:
			res_data = json.loads(response.read().decode())
			if res_data.get("status"):
				return jsonify({"auth_url": res_data["data"]["authorization_url"]})
			return jsonify({"error": "Paystack initialization failed"}), 400
	except urllib.error.HTTPError as e:
		err_res = e.read().decode()
		app.logger.error("Paystack Init Error: %s", err_res)
		return jsonify({"error": "Payment service error. Ensure your Paystack account is configured correctly.", "details": err_res}), 400
	except Exception as e:
		app.logger.exception("Paystack error")
		return jsonify({"error": str(e)}), 500

@app.route("/api/paystack/verify", methods=["POST"])
def paystack_verify():
	user = authenticate_request(request)
	if not user: return jsonify({"error": "Unauthorized"}), 401
	
	data = request.get_json() or {}
	ref = data.get("reference")
	if not ref: return jsonify({"error": "No reference provided"}), 400
	
	req = urllib.request.Request(f"https://api.paystack.co/transaction/verify/{ref}")
	req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
	
	try:
		with urllib.request.urlopen(req) as response:
			res_data = json.loads(response.read().decode())
			if res_data.get("status") and res_data.get("data", {}).get("status") == "success":
				database.execute("UPDATE users SET is_premium = TRUE WHERE id = %s", (user["id"],))
				return jsonify({"success": True})
			return jsonify({"error": "Payment verification failed or not successful"}), 400
	except Exception as e:
		app.logger.exception("Paystack verify error")
		return jsonify({"error": str(e)}), 500


@app.route("/api/properties/<int:pid>/like", methods=["POST"])
def api_like_property(pid):
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	if not user.get("email_verified"):
		return jsonify({"error": "Email verification is required to perform this action."}), 403
	exists = database.fetch_one("SELECT id FROM properties WHERE id = %s", (pid,))
	if not exists:
		return jsonify({"error": "Not found"}), 404
	cur = database.fetch_one(
		"SELECT id FROM likes WHERE property_id = %s AND user_id = %s",
		(pid, user["id"]),
	)
	if cur:
		database.execute("DELETE FROM likes WHERE id = %s", (cur["id"],))
		action = "unliked"
	else:
		database.execute(
			"INSERT INTO likes (property_id, user_id) VALUES (%s, %s)",
			(pid, user["id"]),
		)
		action = "liked"
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	return jsonify({"property": build_property_dict(row), "action": action})


@app.route("/api/properties/<int:pid>", methods=["DELETE"])
def api_delete_property(pid):
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	auth_error = _require_verified_landlord(user)
	if auth_error:
		return auth_error
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	if not row:
		return jsonify({"error": "Not found"}), 404
	if row["landlord_id"] != user["id"]:
		return jsonify({"error": "You can only delete your own properties"}), 403
	try:
		img_rows = database.fetch_all(
			"SELECT id, filename FROM images WHERE property_id = %s",
			(pid,),
		)
		for r in img_rows:
			file_path = os.path.join(IMAGES_DIR, r["filename"]) if r["filename"] else None
			if file_path and os.path.exists(file_path):
				try:
					os.remove(file_path)
				except Exception:
					app.logger.exception("Failed to remove image file: %s", file_path)
		database.execute("DELETE FROM properties WHERE id = %s", (pid,))
		return jsonify({"message": "Property deleted successfully"})
	except Exception as e:
		app.logger.exception("Delete property error")
		return jsonify({"error": "Failed to delete property", "message": str(e)}), 500


@app.route("/api/properties/<int:pid>/images/<path:filename>", methods=["DELETE"])
def api_delete_property_image(pid, filename):
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	auth_error = _require_verified_landlord(user)
	if auth_error:
		return auth_error
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	if not row:
		return jsonify({"error": "Property not found"}), 404
	if row["landlord_id"] != user["id"]:
		return jsonify({"error": "You can only delete images from your own properties"}), 403
	clean_name = filename.replace("..", "").replace("/", "").replace("\\", "")
	img_row = database.fetch_one(
		"SELECT id, filename FROM images WHERE property_id = %s AND filename = %s",
		(pid, clean_name),
	)
	if not img_row:
		return jsonify({"error": "Image not found"}), 404
	file_path = os.path.join(IMAGES_DIR, img_row["filename"])
	if os.path.exists(file_path):
		try:
			os.remove(file_path)
		except Exception:
			app.logger.exception("Failed to remove image file: %s", file_path)
	database.execute("DELETE FROM images WHERE id = %s", (img_row["id"],))
	return jsonify({"message": "Image deleted successfully"})


@app.route("/api/upload", methods=["POST"])
def api_upload():
	try:
		user = authenticate_request(request)
		if not user:
			return jsonify({"error": "Unauthorized"}), 401
		auth_error = _require_verified_landlord(user)
		if auth_error:
			return auth_error
		if "file" not in request.files:
			return jsonify({"error": "No file provided"}), 400
		f = request.files["file"]
		if f.filename == "":
			return jsonify({"error": "Empty filename"}), 400
		filename, rel_path = image_optimize.process_property_upload(
			f.stream, f.filename, IMAGES_DIR
		)
		prop_id = request.form.get("property_id")
		if prop_id:
			try:
				pid = int(prop_id)
				prop = database.fetch_one(
					"SELECT id, landlord_id FROM properties WHERE id = %s",
					(pid,),
				)
				if not prop:
					return jsonify({"error": "Property not found"}), 404
				if prop.get("landlord_id") != user["id"]:
					return jsonify({"error": "You can only upload images for your own properties"}), 403
				database.execute(
					"INSERT INTO images (property_id, filename) VALUES (%s, %s)",
					(pid, filename),
				)
			except Exception:
				app.logger.exception("Failed to associate image with property")
		url = url_for("serve_static", path=rel_path)
		return jsonify({"filename": filename, "url": url})
	except Exception as e:
		app.logger.exception("Upload failed")
		return jsonify({"error": "Upload failed", "message": str(e)}), 500


@app.route("/api/uploads/clear_my_uploads", methods=["POST"])
def api_clear_my_uploads():
	user = authenticate_request(request)
	if not user:
		return jsonify({"error": "Unauthorized"}), 401
	auth_error = _require_verified_landlord(user)
	if auth_error:
		return auth_error
	try:
		rows = database.fetch_all(
			"""
			SELECT images.id AS id, images.filename AS filename
			FROM images
			JOIN properties ON images.property_id = properties.id
			WHERE properties.landlord_id = %s
			""",
			(user["id"],),
		)
		removed = []
		for r in rows:
			img_id = r["id"]
			filename = r["filename"]
			file_path = os.path.join(IMAGES_DIR, filename) if filename else None
			file_existed = False
			try:
				if file_path and os.path.exists(file_path):
					os.remove(file_path)
					file_existed = True
			except Exception:
				app.logger.exception("Failed to remove image file: %s", file_path)
			try:
				database.execute("DELETE FROM images WHERE id = %s", (img_id,))
			except Exception:
				app.logger.exception("Failed to delete DB row for image id %s", img_id)
			removed.append({"id": img_id, "filename": filename, "file_existed": file_existed})
		return jsonify({"removed": removed, "count": len(removed)})
	except Exception as e:
		app.logger.exception("Failed to clear uploads for user %s", user.get("id"))
		return jsonify({"error": "Failed to clear uploads", "message": str(e)}), 500


def _wa_list_properties():
	rows = database.fetch_all(
		"SELECT id, title, price, city, area FROM properties ORDER BY id DESC LIMIT 8"
	)
	return rows


def _wa_get_property(pid):
	row = database.fetch_one("SELECT * FROM properties WHERE id = %s", (pid,))
	return dict(row) if row else None


@app.route("/api/whatsapp/webhook", methods=["GET", "POST"])
def whatsapp_webhook():
	if whatsapp_bot is None:
		return jsonify({"error": "WhatsApp integration not configured"}), 501
	if request.method == "GET":
		return whatsapp_bot.verify_subscription()
	try:
		return whatsapp_bot.handle_webhook_post(
			_wa_list_properties,
			_wa_get_property,
			logger=app.logger,
		)
	except Exception:
		app.logger.exception("WhatsApp webhook error")
		return Response("OK", status=200)


if __name__ == "__main__":
	init_db_on_startup()
	app.run(host="0.0.0.0", port=5000, debug=True)
else:
	init_db_on_startup()

