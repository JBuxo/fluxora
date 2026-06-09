import logging
import os
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Header

load_dotenv(".env.local")

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

logger = logging.getLogger(__name__)


def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except Exception as e:
        logger.warning("verify_token failed secret_set=%s error=%s: %s", bool(SUPABASE_JWT_SECRET), type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Invalid token")
