"""
scripts/db/apply_migration.py
Security-hardened migration runner for Supabase PostgreSQL.

Rules:
1. Reads credentials only from process.env and .env.local.
2. Refuses to run if SUPABASE_DB_URL contains placeholder values.
3. Prints only target project host, port, and database name (never echoes password or connection string).
4. Redacts any credentials from exception traces.
"""
import os
import re
from urllib.parse import urlparse

PLACEHOLDER_PATTERNS = [
    re.compile(r"YOUR[-_]PROJECT[-_]REF", re.IGNORECASE),
    re.compile(r"YOUR[-_]PASSWORD", re.IGNORECASE),
    re.compile(r"placeholder", re.IGNORECASE),
    re.compile(r"changeme", re.IGNORECASE),
    re.compile(r"dummy", re.IGNORECASE),
    re.compile(r"<[^>]+>"),
    re.compile(r"\[[^\]]+\]"),
]

def is_placeholder(val: str | None) -> bool:
    if not val or not val.strip():
        return True
    trimmed = val.strip()
    return any(p.search(trimmed) for p in PLACEHOLDER_PATTERNS)

def load_env_local() -> None:
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                if k not in os.environ:
                    os.environ[k] = v.strip().strip("'\"")

def sanitize_error(err: Exception, password: str | None) -> str:
    msg = str(err)
    if password and password in msg:
        msg = msg.replace(password, "[REDACTED]")
    return msg

def main() -> None:
    load_env_local()
    db_url = os.environ.get("SUPABASE_DB_URL")

    if not db_url or is_placeholder(db_url):
        print("ERR: SUPABASE_DB_URL is missing or contains placeholder values.")
        print("Please set a real PostgreSQL connection URL in .env.local before running migrations.")
        exit(1)

    try:
        parsed = urlparse(db_url)
    except Exception:
        print("ERR: SUPABASE_DB_URL is not a valid URL.")
        exit(1)

    host = parsed.hostname or "unknown"
    port = parsed.port or 5432
    dbname = parsed.path.lstrip("/") or "postgres"

    print("==================================================")
    print("TravelRescue AI: Database Migration Runner")
    print(f"Target Database Host: {host}:{port}")
    print(f"Database Name:        {dbname}")
    print("==================================================")

    migration_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "supabase",
        "migrations",
        "0001_initial_railway_schema.sql"
    )

    if not os.path.exists(migration_path):
        print(f"ERR: Migration file not found at {migration_path}")
        exit(1)

    with open(migration_path, "r", encoding="utf-8") as f:
        sql = f.read()

    try:
        import psycopg2
    except ImportError:
        print("ERR: psycopg2 module is not installed in the current Python environment.")
        exit(1)

    try:
        print(f"Connecting to database host {host}:{port}...")
        conn = psycopg2.connect(db_url, connect_timeout=10)
        conn.autocommit = True
        cursor = conn.cursor()
        print("Applying migration 0001_initial_railway_schema.sql...")
        cursor.execute(sql)
        print("✓ Migration applied successfully!")
        cursor.close()
        conn.close()
    except Exception as e:
        safe_msg = sanitize_error(e, parsed.password)
        print(f"ERR: Failed to apply migration directly: {safe_msg}")

        # Try transaction pooler port 6543
        if ":5432/" in db_url:
            pooler_url = db_url.replace(":5432/", ":6543/")
            print("Retrying via pooler port 6543...")
            try:
                conn = psycopg2.connect(pooler_url, connect_timeout=10)
                conn.autocommit = True
                cursor = conn.cursor()
                cursor.execute(sql)
                print("✓ Migration applied successfully via pooler port 6543!")
                cursor.close()
                conn.close()
                exit(0)
            except Exception as e2:
                safe_msg2 = sanitize_error(e2, parsed.password)
                print(f"ERR: Pooler retry failed: {safe_msg2}")
        exit(1)

if __name__ == "__main__":
    main()
