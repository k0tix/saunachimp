import asyncio
import aiomysql
import pandas as pd
from openai import AsyncOpenAI

import logging
import os


logger = logging.getLogger("logger")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)

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


async def save_result(session_id: str, wellness: str, sensor_timestamp: str):
    conn = await get_conn()
    try:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO wellness_results (session_id, wellness, sensor_timestamp) VALUES (%s, %s, %s)",
                (session_id, wellness, sensor_timestamp),
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
                    """
                    You are a wellness assistant. You will receive sauna sensor data as a list of measurements. Each measurement includes:

                    - TEMP: temperature in Celsius
                    - HUM: relative humidity in %
                    - SENSOR_TIMESTAMP: Unix timestamp in milliseconds

                    Your task is to analyze this data and generate a short, structured wellness report for display on a wellness monitor. The report should include:

                    1. Average, peak, and range of sauna temperature.
                    2. Average, peak, and trend of humidity.
                    3. Duration of the sauna session.
                    4. Time spent in optimal temperature range (45–50 °C).
                    5. Thermal comfort rating (Comfortable / Moderate / Intense).
                    6. Hydration caution if conditions suggest risk (high heat + low humidity for extended periods).
                    7. Optional concise textual insight summarizing the session (1–2 sentences).

                    Output format (example):

                    {
                    "temperature": {
                        "average": 47.2,
                        "peak": 48.3,
                        "range": [46.3, 48.3],
                        "time_in_optimal_range_minutes": 12
                    },
                    "humidity": {
                        "average": 16.0,
                        "peak": 16.4,
                        "trend": "slightly decreasing"
                    },
                    "duration_minutes": 15,
                    "thermal_comfort": "Moderate",
                    "hydration_caution": "Yes",
                    "summary": "You maintained a moderate sauna session with stable heat. Stay hydrated due to low humidity."
                    }

                    Do not invent data or metrics; only report values that can be derived from the input.
                    """
                ),
            },
            {"role": "user", "content": data_str},
        ],
    )
    return response.choices[0].message.content


async def poll():
    logger.info("Polling loop started")
    while True:
        try:
            pending = await fetch_sensor_logs()
            logger.info(pending.head())
            logger.info("Got sensor logs")
            try:
                logger.info("Writing into db")
                result = await wellness_assessment(
                    str(pending.drop(columns=["SESSION_ID", "SENSOR_TIMESTAMP"]).to_dict(orient="records")))
                logger.info(f"{result}")
                await save_result(pending["SESSION_ID"].max(), result, pending["SENSOR_TIMESTAMP"].max())
                logger.info("Written into db")
            except Exception as e:
                logger.info(f"Error processing item with timestamp {pending['SENSOR_TIMESTAMP'].max()}: {e}")

        except Exception as e:
            logger.info(f"Worker loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(poll())
