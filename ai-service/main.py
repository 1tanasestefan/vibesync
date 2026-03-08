"""
VibeSync AI Microservice
========================
FastAPI service that translates multi-modal inputs (image or text) into
deterministic musical parameters by querying a local Ollama LLaVA model.
"""

import base64
import io
import json
import logging
import os
import re
from typing import Optional

from PIL import Image

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_HOST}/api/generate"
MODEL_NAME = os.getenv("MODEL_NAME", "llava")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibesync-ai")

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class VibeResult(BaseModel):
    """Strict output contract returned to the Spring Boot orchestrator."""
    visual_analysis: str = Field(..., description="A brief 1-sentence description of the image's lighting and mood")
    genres: list[str] = Field(..., min_length=1, max_length=5)
    target_tempo: int = Field(..., ge=40, le=220)
    energy: float = Field(..., ge=0.0, le=1.0)
    valence: float = Field(..., ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# System prompt – forces the LLM to return ONLY valid JSON
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are a master music curator and visual analyst. Your ONLY task is to first analyze the provided "
    "input (specifically lighting, color palette, and setting if it's an image) to determine the overall mood. "
    "Based on this analysis, output precise musical parameters that best match the aesthetic.\n\n"
    "You MUST respond with a single, valid JSON object and NOTHING else. "
    "No markdown, no code fences, no explanation, no conversational text.\n\n"
    "The JSON object MUST have exactly these keys:\n"
    '  "visual_analysis" — A brief 1-sentence description of the image\'s lighting and mood\n'
    '  "genres"        — A list of 3 to 4 genres strictly chosen from this list ONLY: [pop, rock, hip-hop, electronic, classical, jazz, chill, acoustic, dance, r-n-b, indie, metal, country, ambient]\n'
    '  "target_tempo"  — an integer BPM between 40 and 220\n'
    '  "energy"        — a float between 0.0 and 1.0\n'
    '  "valence"       — a float between 0.0 and 1.0 (0 = sad/dark, 1 = happy/bright)\n\n'
    "Example of a valid response:\n"
    '{"visual_analysis": "A dimly lit room bathed in neon purple lighting with rain tapping on the window.", "genres": ["chill", "ambient", "electronic"], "target_tempo": 85, "energy": 0.35, "valence": 0.45}\n\n'
    "Respond ONLY with the JSON object."
)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="VibeSync AI Service",
    description="Translates images and text prompts into Spotify musical parameters via local LLaVA.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_json(raw: str) -> dict:
    """
    Attempt to extract a valid JSON object from potentially noisy LLM output.
    Handles cases where the model wraps JSON in markdown code fences.
    """
    # Strip markdown code fences if present
    cleaned = re.sub(r"```json\s*", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"```\s*", "", cleaned)
    cleaned = cleaned.strip().rstrip("`").lstrip("`")
    
    # Fix escaped underscores (e.g. target\_tempo -> target_tempo)
    cleaned = cleaned.replace("\\_", "_")

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fallback: find the first { ... } block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract valid JSON from LLM response: {raw[:300]}")


async def _query_ollama(prompt: str, base64_image: Optional[str] = None) -> dict:
    """
    Send a prompt (and optional base64 image) to the local Ollama instance
    and return the parsed JSON musical parameters.
    """
    payload: dict = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "keep_alive": 0,      # Immediately unload model to prevent VRAM OOM
        "options": {
            "temperature": 0.3,   # Low temperature for deterministic output
        },
    }

    if base64_image:
        payload["images"] = [base64_image]

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(OLLAMA_GENERATE_URL, json=payload)
            response.raise_for_status()
    except httpx.ConnectError:
        logger.error("Ollama is unreachable at %s", OLLAMA_GENERATE_URL)
        raise HTTPException(
            status_code=503,
            detail=(
                f"The local AI model (Ollama) is not reachable at {OLLAMA_HOST}. "
                "Please ensure Ollama is running: `ollama serve`"
            ),
        )
    except httpx.HTTPStatusError as exc:
        logger.error("Ollama returned HTTP %s: %s", exc.response.status_code, exc.response.text)
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned an error: {exc.response.status_code}",
        )
    except httpx.TimeoutException:
        logger.error("Ollama request timed out after 120 s")
        raise HTTPException(
            status_code=504,
            detail="The AI inference request timed out. The model may be loading or the input too complex.",
        )

    raw_text = response.json().get("response", "")
    logger.info("Raw Ollama response: %s", raw_text[:500])

    try:
        parsed = _extract_json(raw_text)
        result = VibeResult(**parsed)
        return result.model_dump()
    except (ValueError, Exception) as exc:
        logger.error("Failed to parse Ollama output: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=f"The AI model returned an unparseable response. Raw output: {raw_text[:300]}",
        )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    """Liveness probe for orchestrators and load balancers."""
    return {"status": "healthy", "model": MODEL_NAME}


@app.post("/api/v1/analyze-vibe", response_model=VibeResult)
async def analyze_vibe(
    image: UploadFile | None = File(default=None),
    prompt: str | None = Form(default=None),
):
    """
    Analyze a vibe from an uploaded image or a text prompt and return
    Spotify-compatible musical parameters.

    - **image**: An image file (JPEG, PNG, WebP) depicting a mood or scene.
    - **prompt**: A textual description of the desired vibe.

    At least one of the two must be provided. If both are given, the image
    takes precedence and the text is appended as additional context.
    """
    # Gracefully handle string "null" or empty string from form data
    if prompt is not None:
        prompt_stripped = prompt.strip()
        if prompt_stripped.lower() == "null" or prompt_stripped == "":
            prompt = None

    if not image and not prompt:
        raise HTTPException(
            status_code=400,
            detail="You must provide either an image file or a text prompt (or both).",
        )

    base64_image: Optional[str] = None
    llm_prompt: str

    # --- Image path ---
    if image:
        contents = await image.read()
        
        # Open with Pillow to strip heavy channels (like Alpha) and downscale to prevent OOM
        try:
            with Image.open(io.BytesIO(contents)) as pil_img:
                # Convert to RGB (drops Alpha/RGBA/CMYK bloat)
                if pil_img.mode != "RGB":
                    pil_img = pil_img.convert("RGB")
                
                # Resize if maximum dimension exceeds 800px (keeps aspect ratio)
                max_dim = 800
                if max(pil_img.width, pil_img.height) > max_dim:
                    pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
                # Save compressed image to buffer
                buffer = io.BytesIO()
                pil_img.save(buffer, format="JPEG", quality=85)
                compressed_bytes = buffer.getvalue()
                
            base64_image = base64.b64encode(compressed_bytes).decode("utf-8")
            logger.info(f"Image compressed successfully. Size reduced from {len(contents)} to {len(compressed_bytes)} bytes.")
        except Exception as e:
            logger.error(f"Failed to process image with Pillow, falling back to raw bytes: {e}")
            base64_image = base64.b64encode(contents).decode("utf-8")

        llm_prompt = (
            "First, thoroughly analyze the lighting, color palette, and setting of this image to determine its mood. "
            "Based on your analysis, output the musical parameters (visual_analysis, genres, target_tempo, energy, valence) "
            "that definitively match this visual vibe."
        )
        if prompt:
            llm_prompt += f"\n\nAdditional user context: {prompt}"
    # --- Text-only path ---
    else:
        llm_prompt = (
            f"The user describes the following vibe: \"{prompt}\"\n\n"
            "First, analyze the mood and setting inferred by this description. "
            "Based on this, determine the musical parameters (visual_analysis, genres, target_tempo, energy, valence) "
            "that best match this requested vibe."
        )

    logger.info("Processing vibe analysis — image=%s, prompt=%s", bool(image), bool(prompt))
    return await _query_ollama(llm_prompt, base64_image)


# ---------------------------------------------------------------------------
# Entry point (for direct execution)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
