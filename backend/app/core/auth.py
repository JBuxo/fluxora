import os
import jwt
from dotenv import load_dotenv
from fastapi import HTTPException, Header

load_dotenv()

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")


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
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
