"""
Apply Supabase SQL migration to Postgres database
"""
import os
import psycopg2

def load_env_local():
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip().strip("'\"")

load_env_local()
db_url = os.environ.get("SUPABASE_DB_URL")
if not db_url:
    print("ERR: SUPABASE_DB_URL not found in .env.local")
    exit(1)

# Notice port 5432 or 6543 (pooler)
migration_path = os.path.join(os.path.dirname(__file__), "..", "..", "supabase", "migrations", "0001_initial_railway_schema.sql")
with open(migration_path, "r", encoding="utf-8") as f:
    sql = f.read()

print(f"Connecting to database...")
try:
    conn = psycopg2.connect(db_url, connect_timeout=10)
    conn.autocommit = True
    cursor = conn.cursor()
    print("Applying migration 0001_initial_railway_schema.sql...")
    cursor.execute(sql)
    print("✓ Migration applied successfully!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"ERR: Failed to apply migration directly: {e}")
    # Try transaction pooler port 6543 or session pooler
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
            print(f"ERR: Pooler retry failed: {e2}")
    exit(1)
