from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)

@router.get("")
async def health_check():
    """
    Health check endpoint to ensure the API is running correctly.
    """
    return {"status": "ok", "message": "FairAI API is up and running."}
