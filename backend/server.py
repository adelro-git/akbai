from fastapi import FastAPI, Request
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AKBai API Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

NEXTJS_URL = "http://localhost:3000"


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
async def proxy_to_nextjs(path: str, request: Request):
    """Forward all /api/* requests to Next.js on port 3000."""
    url = f"{NEXTJS_URL}/api/{path}"
    if request.url.query:
        url = f"{url}?{request.url.query}"

    body = await request.body()

    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in ("host", "content-length", "transfer-encoding")
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            proxied = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
            )
        return Response(
            content=proxied.content,
            status_code=proxied.status_code,
            headers=dict(proxied.headers),
            media_type=proxied.headers.get("content-type"),
        )
    except httpx.ConnectError:
        logger.error(f"Cannot connect to Next.js at {url}")
        return Response(
            content=b'{"error":"Next.js server not ready"}',
            status_code=503,
            media_type="application/json",
        )
    except Exception as exc:
        logger.error(f"Proxy error: {exc}")
        return Response(
            content=b'{"error":"Proxy error"}',
            status_code=500,
            media_type="application/json",
        )
