from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

# SQLite database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "fabricguard.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Minimize memory usage by limiting connection pool for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=None,  # Disable connection pooling for SQLite
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    scans = relationship("ScanHistory", back_populates="owner")

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)
    defect_key = Column(String)
    defect_label = Column(String)
    confidence = Column(Float)
    severity = Column(String)
    reason_1 = Column(Text)
    reason_2 = Column(Text)
    reason_3 = Column(Text)
    machine = Column(String)
    suggestion = Column(Text)
    status = Column(String) # 'ok' or 'defect'
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    owner = relationship("User", back_populates="scans")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
