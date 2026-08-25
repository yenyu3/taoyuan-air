from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:3000"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"
    GEMINI_ENABLE_URL_CONTEXT: bool = False
    AI_CACHE_TTL_SECONDS: int = 900
    AI_DAILY_USER_LIMIT: int = 100
    AI_REQUEST_TIMEOUT_SECONDS: int = 90
    AI_TRUST_ENV_PROXY: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
