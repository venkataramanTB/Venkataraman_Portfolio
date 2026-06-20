from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ADMIN_EMAIL: str = "venkataraman.tb@mythics.com"
    ADMIN_PASSWORD: str = "changeme"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    GEMINI_API_KEY: str = ""
    PROXYCURL_API_KEY: str = ""

    @property
    def origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
