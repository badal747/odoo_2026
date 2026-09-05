import asyncio
import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import pytest

load_dotenv()

@pytest.mark.anyio
async def test_connection():
    uri = os.getenv("MONGODB_URL")
    print(f"Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(uri, tlsCAFile=certifi.where())
    try:
        # Ping the server
        result = await client.admin.command('ping')
        print(f"MongoDB Atlas Connection SUCCESSFUL! Ping response: {result}")
        db_name = os.getenv("DATABASE_NAME", "peoplepay360")
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"Database: {db_name}, Existing collections: {collections}")
    except Exception as e:
        print(f"Connection Failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
