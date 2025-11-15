import asyncio
import aiomysql
import pandas as pd
from fastapi import FastAPI, HTTPException
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


async def fetch_sensor_logs():
    conn = await get_conn()
    try:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                """
                SELECT TEMP, HUM, SENSOR_TIMESTAMP, SESSION_ID
                FROM sensor_logs
                WHERE session_id = (
                    SELECT session_id
                    FROM sensor_logs
                    ORDER BY sensor_timestamp DESC
                    LIMIT 1
                );
                """
            )
            rows = await cur.fetchall()
            column_names = [desc[0] for desc in cur.description]
            df = pd.DataFrame(rows, columns=column_names)
            return df
    finally:
        conn.close()


async def save_result(session_id: str, wellness: str):
    conn = await get_conn()
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO wellness_results (session_id, wellness) VALUES (%s, %s)",
                (session_id, wellness),
            )
    finally:
        conn.close()


async def wellness_assessment(data_str: str):
    response = await client.chat.completions.create(
        model="gpt-5",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a wellness assessment AI. Analyze the provided sauna sensor data "
                    "and generate a very concise wellness evaluation with meaningful insights "
                    "and recommendations."
                ),
            },
            {"role": "user", "content": data_str},
        ],
    )
    return response.choices[0].message.content


async def poll():
    print("Polling loop started")

    while True:
        try:
            pending = await fetch_sensor_logs()

            if not pending:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                continue

            try:
                result = await wellness_assessment(
                    str(pending.drop(columns=["SESSION_ID"]).to_dict(oriend="records")))
                await save_result([pending["SESSION_ID"].max(), result])
            except Exception as e:
                print(f"Error processing item with timestamp {pending["SENSOR_TIMESTAMP"].max()}: {e}")

        except Exception as e:
            print(f"Worker loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


@app.on_event("startup")
async def startup():
    asyncio.create_task(poll())


@app.get("/wellness")
async def wellness():
    conn = await get_conn()
    try:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT wellness FROM wellness_results ORDER BY id DESC LIMIT 1"
            )
            row = await cur.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="No wellness results found")

            return {"wellness": row["wellness"]}
    finally:
        conn.close()
