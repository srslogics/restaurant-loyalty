from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.venues import VENTURES


def main() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is missing.")

    schema_sql = (PROJECT_ROOT / "db" / "schema.sql").read_text(encoding="utf-8")

    with psycopg.connect(database_url, sslmode="require") as connection:
        with connection.cursor() as cursor:
            cursor.execute(schema_sql)
            for venue in VENTURES:
                cursor.execute(
                    """
                    insert into venues (slug, name, tagline, table_prefix, default_table_count)
                    values (%s, %s, %s, %s, %s)
                    on conflict (slug)
                    do update set
                      name = excluded.name,
                      tagline = excluded.tagline,
                      table_prefix = excluded.table_prefix,
                      default_table_count = excluded.default_table_count,
                      updated_at = now()
                    """,
                    (
                        venue["slug"],
                        venue["name"],
                        venue["tagline"],
                        venue["table_prefix"],
                        venue["default_table_count"],
                    ),
                )

        connection.commit()

    print(f"Database ready. Seeded {len(VENTURES)} ventures.")


if __name__ == "__main__":
    main()
