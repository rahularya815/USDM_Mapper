from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import json
import aiofiles
import fitz
import uuid
from typing import Dict, Any

app = FastAPI(title="USDM Mapper")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


@app.post("/upload")
async def upload_files(
    pdf: UploadFile = File(...),
    template: UploadFile = File(...)
):
    """Upload both PDF and Template JSON files."""
    try:
        # Validate PDF
        if not pdf.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed for 'pdf' field")
        
        # Validate JSON template
        if not template.filename.lower().endswith('.json'):
            raise HTTPException(status_code=400, detail="Only JSON files are allowed for 'template' field")
        
        # Generate unique project ID
        project_id = str(uuid.uuid4())
        
        # Save PDF
        pdf_path = UPLOAD_DIR / f"{project_id}.pdf"
        pdf_content = await pdf.read()
        async with aiofiles.open(pdf_path, 'wb') as f:
            await f.write(pdf_content)
        
        # Save template JSON
        template_path = UPLOAD_DIR / f"{project_id}_template.json"
        template_content = await template.read()
        
        # Validate JSON
        try:
            template_json = json.loads(template_content.decode('utf-8'))
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON template file")
        
        async with aiofiles.open(template_path, 'wb') as f:
            await f.write(template_content)
        
        # Get PDF info
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        doc.close()
        
        return {
            "project_id": project_id,
            "pdf_filename": pdf.filename,
            "template_filename": template.filename,
            "page_count": page_count,
            "template": template_json,
            "pdf_url": f"/pdf/{project_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")


@app.get("/pdf/{project_id}")
async def get_pdf(project_id: str):
    """Get a PDF file by project ID."""
    file_path = UPLOAD_DIR / f"{project_id}.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(file_path, media_type="application/pdf")


@app.post("/submit")
async def submit_json(data: Dict[str, Any]):
    """Submit the final JSON data and save it as filled_output.json."""
    try:
        output_path = OUTPUT_DIR / "filled_output.json"
        
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        return {
            "message": "JSON saved successfully",
            "filename": "filled_output.json",
            "path": str(output_path),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving JSON: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
