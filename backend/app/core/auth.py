import json
import logging
import os
import urllib.request

import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Header

load_dotenv(".env.local")

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

_jwt_key = None
_jwt_alg = "HS256"


def _load_key():
    global _jwt_key, _jwt_alg
    if SUPABASE_URL:
        try:
            with urllib.request.urlopen(
                f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=5
            ) as r:
                jwks = json.loads(r.read())
            key_data = jwks["keys"][0]
            _jwt_alg = key_data.get("alg", "ES256")
            _jwt_key = jwt.algorithms.ECAlgorithm.from_jwk(json.dumps(key_data))
            logger.info("JWT: loaded %s key from JWKS", _jwt_alg)
            return
        except Exception as e:
            logger.warning("JWKS fetch failed, falling back to HS256: %s", e)

    _jwt_key = SUPABASE_JWT_SECRET
    _jwt_alg = "HS256"
    logger.info("JWT: using HS256 secret")


_load_key()


_DEV_USER_ID = os.environ.get("DEV_USER_ID")
_DEVELOPMENT = os.environ.get("DEVELOPMENT", "").lower() == "true"


def verify_token(authorization: str = Header(...)):
    if _DEVELOPMENT and _DEV_USER_ID:
        return {"sub": _DEV_USER_ID, "role": "authenticated"}
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(
            token, _jwt_key, algorithms=[_jwt_alg], audience="authenticated"
        )
        return payload
    except Exception as e:
        logger.warning("verify_token failed alg=%s error=%s: %s", _jwt_alg, type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Invalid token")
