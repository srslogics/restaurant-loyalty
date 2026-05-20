from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
import os
import random
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import psycopg
from psycopg.rows import dict_row


load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(title="Yamazaki Feedback API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@contextmanager
def get_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Database is not configured.")

    with psycopg.connect(DATABASE_URL, sslmode="require", row_factory=dict_row) as connection:
        yield connection


class Metrics(BaseModel):
    food: int = 0
    service: int = 0
    ambience: int = 0
    cleanliness: int = 0


class FeedbackIn(BaseModel):
    venueSlug: str
    venue: str
    table: str
    overallScore: int = Field(ge=1, le=5)
    visitType: str = "Not specified"
    highlights: list[str] = Field(default_factory=list)
    comments: str = ""
    guestName: str = ""
    guestPhone: str = ""
    metrics: Metrics = Field(default_factory=Metrics)


def build_reference_id() -> str:
    now = datetime.now()
    return f"YFB-{now:%Y%m%d}-{random.randint(1000, 9999)}"


def normalize_feedback_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "referenceId": row["reference_id"],
        "venueSlug": row["venue_slug"],
        "venue": row["venue_name"],
        "table": row["table_code"],
        "overallScore": row["overall_score"],
        "visitType": row["visit_type"],
        "highlights": row.get("highlights") or [],
        "comments": row.get("comments") or "",
        "guestName": row.get("guest_name") or "",
        "guestPhone": row.get("guest_phone") or "",
        "metrics": {
            "food": row.get("food_score") or 0,
            "service": row.get("service_score") or 0,
            "ambience": row.get("ambience_score") or 0,
            "cleanliness": row.get("cleanliness_score") or 0,
        },
        "createdAt": row["created_at"].isoformat() if row.get("created_at") else None,
    }


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    if not DATABASE_URL:
        return {"ok": True, "database": "not-configured"}

    try:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select 1")
                cursor.fetchone()
    except Exception as exc:  # pragma: no cover - runtime dependent
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"ok": True, "database": "connected"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/api/venues")
def list_venues() -> list[dict[str, Any]]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                select slug, name, tagline, table_prefix, default_table_count
                from venues
                where is_active = true
                order by name asc
                """
            )
            rows = cursor.fetchall()

    return [
        {
            "slug": row["slug"],
            "name": row["name"],
            "tagline": row["tagline"],
            "tablePrefix": row["table_prefix"],
            "defaultTableCount": row["default_table_count"],
        }
        for row in rows
    ]


@app.get("/api/feedback")
def list_feedback(
    venue: str | None = Query(default=None),
    rating: str | None = Query(default=None),
) -> list[dict[str, Any]]:
    clauses: list[str] = []
    values: list[Any] = []

    if venue and venue != "all":
        clauses.append("venue_slug = %s")
        values.append(venue)

    if rating == "low":
        clauses.append("overall_score <= 2")
    elif rating == "mid":
        clauses.append("overall_score = 3")
    elif rating == "high":
        clauses.append("overall_score >= 4")

    where_sql = f"where {' and '.join(clauses)}" if clauses else ""

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                select reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
                       food_score, service_score, ambience_score, cleanliness_score, highlights,
                       comments, guest_name, guest_phone, created_at
                from feedback_responses
                {where_sql}
                order by created_at desc
                limit 500
                """,
                values,
            )
            rows = cursor.fetchall()

    return [normalize_feedback_row(row) for row in rows]


@app.post("/api/feedback", status_code=201)
def create_feedback(payload: FeedbackIn) -> dict[str, Any]:
    reference_id = build_reference_id()

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "select slug from venues where slug = %s and is_active = true",
                (payload.venueSlug,),
            )
            venue_exists = cursor.fetchone()
            if not venue_exists:
                raise HTTPException(status_code=400, detail="Invalid venue selected.")

            cursor.execute(
                """
                insert into feedback_responses (
                    reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
                    food_score, service_score, ambience_score, cleanliness_score, highlights,
                    comments, guest_name, guest_phone
                ) values (
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s
                )
                returning reference_id, venue_slug, venue_name, table_code, overall_score, visit_type,
                          food_score, service_score, ambience_score, cleanliness_score, highlights,
                          comments, guest_name, guest_phone, created_at
                """,
                (
                    reference_id,
                    payload.venueSlug,
                    payload.venue,
                    payload.table,
                    payload.overallScore,
                    payload.visitType,
                    payload.metrics.food,
                    payload.metrics.service,
                    payload.metrics.ambience,
                    payload.metrics.cleanliness,
                    payload.highlights,
                    payload.comments,
                    payload.guestName,
                    payload.guestPhone,
                ),
            )
            row = cursor.fetchone()
        connection.commit()

    return normalize_feedback_row(row)


app.mount("/", StaticFiles(directory=PROJECT_ROOT, html=True), name="static")
