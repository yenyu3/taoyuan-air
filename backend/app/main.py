from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import ai, exam_point, explorer, teds_point, uav, wind_lidar

app = FastAPI(title="Taoyuan Air API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(uav.router,  prefix="/api")
app.include_router(teds_point.router, prefix="/api")
app.include_router(exam_point.router, prefix="/api")
app.include_router(explorer.router, prefix="/api")
app.include_router(wind_lidar.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
