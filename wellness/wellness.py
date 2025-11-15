import asyncio
import aiomysql
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import AsyncOpenAI

import os

load_dotenv()

app = FastAPI()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", 60))

async def get_conn():
    return await aiomysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        autocommit=True,
    )

async def fetch_sensor_logs() -> List[Dict]:
    conn = await get_src_conn()
    try:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT id, input_text FROM sensor_logs WHERE processed = 0 ORDER BY id ASC LIMIT %s",
                (limit,),
            )
            return await cur.fetchall()
    finally:
        conn.close()


async def mark_item_processed(item_id: int):
    conn = await get_src_conn()
    try:
        async with conn.cursor() as cur:
            await cur.execute("UPDATE pending_items SET processed = 1 WHERE id = %s", (item_id,))
    finally:
        conn.close()


async def save_result_to_target(source_id: int, result_text: str):
    conn = await get_dst_conn()
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO assessment_results (source_id, result_text) VALUES (%s, %s)",
                (source_id, result_text),
            )
    finally:
        conn.close()

async def poll():
    print("Polling loop started")

    while True:
        try:
            pending = await fetch_pending_items(limit=10)

            if not pending:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                continue

            for item in pending:
                item_id = item["id"]
                text = item["input_text"]

                try:
                    result = await call_openai_assessment(text)
                    await save_result_to_target(item_id, result)
                    await mark_item_processed(item_id)
                    print(f"Processed item {item_id}")
                except Exception as e:
                    print(f"Error processing item {item_id}: {e}")

        except Exception as e:
            print(f"Worker loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)

@app.on_event("startup")
async def startup():
    asyncio.create_task(poll())

@app.get("/wellness")
async def wellness():
