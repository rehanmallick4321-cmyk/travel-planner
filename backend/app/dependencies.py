from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from supabase import create_client, Client

from app.config import settings

security = HTTPBearer()


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


def get_supabase_admin() -> Client:
    """Create and return a Supabase admin client (service role)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extract and verify the JWT token, returning the user ID.

    Raises HTTPException 401 if the token is missing or invalid.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
