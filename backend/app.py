from fileinput import filename

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import uvicorn
from ultralytics import YOLO
import pandas as pd
import io
from PIL import Image
import os
import json
import datetime
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import List, Optional
import shutil

# Local imports
from database import User, ScanHistory, init_db, get_db

# Security Constants
SECRET_KEY = "neuai-secret-key-for-fabricguard" # In production, use env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fabric-dd-bbfrontend.onrender.com",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5500",
        "http://localhost:5501",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# Serve uploads as static files so frontend can see them
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Constants
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR,"model","det_best.pt")
EXCEL_PATH = os.path.join(BASE_DIR,"data","Fabric Defect Reason,Machine,Suggestion Dataset.xlsx")

# Global variables
model = None
mapping_data = {}

# Pydantic Models for API
class UserSignup(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class UserProfile(BaseModel):
    id: int
    full_name: str
    email: str

# Auth Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def normalize_defect_name(name):
    return str(name).strip().lower().replace('-', ' ').replace('_', ' ')

def load_resources():
    global model, mapping_data
    print(f"Loading model from {MODEL_PATH}...")
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        print("Model loaded successfully")
    
    if os.path.exists(EXCEL_PATH):
        try:
            df = pd.read_excel(EXCEL_PATH)
            for _, row in df.iterrows():
                defect_name = normalize_defect_name(row['Defect Category'])
                mapping_data[defect_name] = {
                    "reason_1": str(row.get('1st Priority (Most Likely)', 'N/A')),
                    "reason_2": str(row.get('2nd Priority (Check Next )', 'N/A')),
                    "reason_3": str(row.get('3rd Priority (Rare)', 'N/A')),
                    "suggestion": str(row.get('Suggestion to reduce future defect', 'N/A')),
                    "machine": str(row.get('Machine Responsible', 'N/A'))
                }
            print("Mapping loaded successfully.")
        except Exception as e:
            print(f"Error loading Excel: {e}")

@app.on_event("startup")
async def startup_event():
    init_db()
    load_resources()

@app.get("/")
async def root():
    return {"status": "online", "model_loaded": model is not None}

# --- Auth Endpoints ---

@app.post("/signup")
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": "User created successfully"}

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # If user doesn't exist or password doesn't match, deny access
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": user.full_name
    }

@app.get("/users/me", response_model=UserProfile)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- Prediction & History Endpoints ---

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Read and process image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Save image to uploads folder
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = os.path.basename(file.filename)
        filename = f"{timestamp}_{safe_name}"
        file_path = os.path.join(UPLOADS_DIR, filename)

        
        # We need to seek back to start if we use the file object, 
        # but since we already have 'contents', we'll just write it
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Resize image to save memory on Render's free tier (512MB limit)
        image.thumbnail((416, 416))
        
        # Run inference
        results = model.predict(image, verbose=False, conf=0.25)
        result = results[0]
        
        # Check if any detections found
        if len(result.boxes) == 0:
            # No defect detected
            return {
                "status": "ok",
                "defect_key": "defect free",
                "defect_label": "No Defect Detected",
                "confidence": 100.0,
                "severity": "None",
                "detections": [],
                "reason_1": "No defects found",
                "reason_2": "N/A",
                "reason_3": "N/A",
                "machine": "N/A",
                "suggestion": "Fabric is in good condition",
                "image_url": f"https://fabric-dd-bb.onrender.com/uploads/{filename}"
            }
        
        # Process detections with bounding boxes
        detections = []
        for i, box in enumerate(result.boxes, start=1):
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            
            defect_name = result.names[cls_id]
            normalized_defect = normalize_defect_name(defect_name)
            
            info = mapping_data.get(normalized_defect, {
                "reason_1": "No specific data available",
                "reason_2": "N/A",
                "reason_3": "N/A",
                "suggestion": "Manual inspection recommended",
                "machine": "Unknown"
            })
            
            detections.append({
                "detection_id": i,
                "defect_type": defect_name,
                "defect_key": normalized_defect,
                "confidence": round(conf * 100, 2),
                "bbox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "width": x2 - x1,
                    "height": y2 - y1
                },
                "reason_1": info.get("reason_1"),
                "reason_2": info.get("reason_2"),
                "reason_3": info.get("reason_3"),
                "machine": info.get("machine"),
                "suggestion": info.get("suggestion")
            })
        
        # Use first detection as primary result
        primary = detections[0]
        status_val = "defect"
        severity = "High" if primary["confidence"] > 75 else "Medium" if primary["confidence"] > 50 else "Low"
    
        
        return {
            "status": status_val,
            "defect_key": primary["defect_key"],
            "defect_label": primary["defect_type"],
            "confidence": primary["confidence"],
            "severity": severity,
            "detections": detections,
            "detection_count": len(detections),
            "reason_1": primary.get("reason_1"),
            "reason_2": primary.get("reason_2"),
            "reason_3": primary.get("reason_3"),
            "machine": primary.get("machine"),
            "suggestion": primary.get("suggestion"),
            "image_url": f"https://fabric-dd-bb.onrender.com/uploads/{filename}"
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).order_by(ScanHistory.created_at.desc()).all()
    return scans

@app.get("/analytics")
async def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(ScanHistory).filter(ScanHistory.user_id == current_user.id).all()
    total = len(scans)
    defects = len([s for s in scans if s.status == "defect"])
    ok = total - defects
    rate = round((defects / total * 100), 1) if total > 0 else 0
    
    return {
        "total": total,
        "defects": defects,
        "ok": ok,
        "rate": f"{rate}%"
    }

if __name__ == "__main__":
    import os
    import uvicorn
    # Use PORT environment variable for Render deployment
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
