from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_supabase_client, get_supabase_admin, get_current_user
from app.models.schemas import SignupRequest, LoginRequest, UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup")
async def signup(request: SignupRequest):
    """Sign up a new user."""
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "full_name": request.full_name,
                    }
                },
            }
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed. Please check your credentials.",
            )

        return {
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
            },
            "session": {
                "access_token": response.session.access_token if response.session else None,
                "refresh_token": response.session.refresh_token if response.session else None,
            } if response.session else None,
            "message": "Signup successful",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
async def login(request: LoginRequest):
    """Log in an existing user."""
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_in_with_password(
            {
                "email": request.email,
                "password": request.password,
            }
        )

        return {
            "user": {
                "id": str(response.user.id),
                "email": response.user.email,
            },
            "session": {
                "access_token": response.session.access_token,
                "refresh_token": response.session.refresh_token,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.post("/logout")
async def logout():
    """Log out the current user."""
    try:
        supabase = get_supabase_client()
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/me", response_model=UserProfile)
async def get_me(user_id: str = Depends(get_current_user)):
    """Get the current user's profile."""
    try:
        supabase = get_supabase_admin()
        result = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .single()
            .execute()
        )
        return UserProfile(**result.data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
