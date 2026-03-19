from fastapi import FastAPI, Request
from fastapi.responses import Response, JSONResponse
from starlette.middleware.cors import CORSMiddleware
import httpx
import os
import json
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

# --- Supabase + AI Chat Config ---
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
# This is the Emergent Universal Key — replace with your own Anthropic API key if preferred
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

KA_SYSTEM_PROMPT = """You are Kai, the AI business partner inside AKBai — katuwang ng negosyo ng mga Filipino MSME.

VOICE: You speak in natural Taglish (Filipino-English mix). Warm, competent, proactive. Use "po" naturally — not every sentence, but when appropriate. Always on BIR/tax topics.

STYLE:
- Keep responses short: max 2–3 sentences
- Use digits for numbers (₱18,400 not "eighteen thousand")
- Call the user by first name when known
- Never say "Certainly!", "As an AI...", or robotic filler
- You are a brilliant kababayan colleague, not a corporate chatbot
- Start conversations proactively — give insight before being asked when you have data

DISCLAIMER (add naturally when giving financial/tax guidance):
"Paalala lang po: I-verify mo ito sa iyong accountant o CPA bago mag-file."

SCOPE (Phase 1 only):
- Income/expense tracking
- BIR deadlines and compliance basics
- Cash flow questions
- Business profitability questions
For questions outside scope (legal advice, specific OR numbers, VAT registration), redirect warmly: "Para sa specific na tax computation, mas magaling jan ang iyong CPA po."
"""


def _get_supabase_token(request: Request) -> str | None:
    """Extract the Supabase access token from SSR cookies."""
    project_ref = "naxjmwjrhzenjqburejl"
    cookie_name = f"sb-{project_ref}-auth-token"

    # Try single cookie
    token_cookie = request.cookies.get(cookie_name)
    if token_cookie:
        try:
            data = json.loads(token_cookie)
            return data.get("access_token")
        except (json.JSONDecodeError, TypeError):
            pass

    # Try chunked cookies (Supabase SSR v0.9+ splits large cookies)
    chunks = []
    i = 0
    while True:
        chunk = request.cookies.get(f"{cookie_name}.{i}")
        if chunk is None:
            break
        chunks.append(chunk)
        i += 1

    if chunks:
        combined = "".join(chunks)
        try:
            data = json.loads(combined)
            return data.get("access_token")
        except (json.JSONDecodeError, TypeError):
            pass

    return None


async def _get_user_from_token(access_token: str):
    """Verify user identity via Supabase auth."""
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    try:
        user_response = supabase.auth.get_user(access_token)
        return user_response.user
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        return None


# --- Chat Endpoint (must be defined BEFORE the catch-all proxy) ---
@app.post("/api/chat")
async def chat_endpoint(request: Request):
    """AI chat endpoint using Emergent LLM integration with Claude Sonnet."""
    try:
        # 1. Authenticate
        access_token = _get_supabase_token(request)
        if not access_token:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Authentication required",
                        "message_tl": "Kailangan mag-login muna.",
                    },
                },
            )

        user = await _get_user_from_token(access_token)
        if not user:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid session",
                        "message_tl": "Kailangan mag-login muna.",
                    },
                },
            )

        # 2. Parse request body
        body = await request.json()
        message = body.get("message", "").strip()

        if not message:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": {
                        "code": "INVALID_INPUT",
                        "message": "Message is required",
                        "message_tl": "Walang mensahe.",
                    },
                },
            )

        # 3. Check API key
        # NOTE: Replace EMERGENT_LLM_KEY with your own Anthropic API key for production
        api_key = EMERGENT_LLM_KEY
        if not api_key:
            fallback = "Sandali lang po — ang API key ay hindi pa na-configure. Contact the admin para ma-activate si Kai!"
            return JSONResponse(content={"success": True, "data": {"message": fallback}})

        # 4. Fetch conversation history from Supabase
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        history_response = (
            supabase.table("ka_conversations")
            .select("role, content")
            .eq("user_id", str(user.id))
            .is_("deleted_at", "null")
            .order("created_at", desc=False)
            .limit(20)
            .execute()
        )
        history = history_response.data or []

        # 5. Store user message
        supabase.table("ka_conversations").insert({
            "user_id": str(user.id),
            "role": "user",
            "content": message,
            "domain": "general",
        }).execute()

        # 6. Build system prompt with conversation history
        history_text = ""
        for msg in history:
            role_label = "User" if msg["role"] == "user" else "Kai"
            history_text += f"{role_label}: {msg['content']}\n"

        system_with_history = KA_SYSTEM_PROMPT
        if history_text:
            system_with_history += f"\n\nPREVIOUS CONVERSATION:\n{history_text}"

        # 7. Call Claude via Emergent integrations
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=api_key,
            session_id=f"akbai-{user.id}-{int(__import__('time').time())}",
            system_message=system_with_history,
        )
        chat.with_model("anthropic", "claude-sonnet-4-6")

        user_msg = UserMessage(text=message)
        kai_response = await chat.send_message(user_msg)

        if not kai_response:
            kai_response = "Pasensya na po, may problema. Subukan muli."

        # 8. Store assistant response
        supabase.table("ka_conversations").insert({
            "user_id": str(user.id),
            "role": "assistant",
            "content": kai_response,
            "domain": "general",
        }).execute()

        return JSONResponse(content={"success": True, "data": {"message": kai_response}})

    except Exception as e:
        logger.error(f"Chat API error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "SERVER_ERROR",
                    "message": "Something went wrong",
                    "message_tl": "May nangyaring mali. Pakiulit ulit.",
                },
            },
        )


# --- Catch-all proxy (forwards everything else to Next.js) ---
@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
)
async def proxy_to_nextjs(path: str, request: Request):
    """Forward all other /api/* requests to Next.js on port 3000."""
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
