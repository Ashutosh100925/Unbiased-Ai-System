import os
import sys

# Mocking the Vercel environment
os.environ["VERCEL"] = "1"

try:
    from api.index import app
    print("Successfully imported app from api/index.py")
    
    # Try a fake request
    import asyncio
    async def test():
        scope = {
            "type": "http",
            "method": "GET",
            "path": "/api/health",
            "query_string": b"",
            "headers": []
        }
        async def receive(): return {"type": "http.request"}
        async def send(message): 
            if message["type"] == "http.response.start":
                print(f"Status: {message['status']}")
            elif message["type"] == "http.response.body":
                print(f"Body: {message['body']}")
        
        print("Testing /api/health...")
        await app(scope, receive, send)

    asyncio.run(test())

except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
