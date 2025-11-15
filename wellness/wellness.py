import asyncio
import aiomysql
from fastapi import FastAPI
from pydantic import BaseModel
from openai import AsyncOpenAI

import os


app = FastAPI()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", 60))
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PWD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")


async def get_conn():
    return await aiomysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PWD,
        db=DB_NAME,
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


async def save_result_to_target(session_id: str, wellness: str):
    conn = await get_conn()
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO wellness_results (session_id, wellness) VALUES (%s, %s)",
                (session_id, wellness),
            )
    finally:
        conn.close()


async def wellness_assessment():
    pass


async def poll():
    print("Polling loop started")

    while True:
        try:
            pending = await fetch_sensor_logs()

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
