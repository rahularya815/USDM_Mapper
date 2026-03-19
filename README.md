# PDF-to-JSON Data Extraction Tool

A full-stack application for extracting data from PDF documents and mapping it to structured JSON templates. Built with FastAPI backend and React (Vite) frontend.

## Features

- **Split-Pane UI**: 50/50 layout with PDF viewer on the left and JSON editor on the right
- **Text Selection**: Highlight text in PDF and map it directly to JSON fields
- **Recursive JSON Editor**: Handle nested objects and arrays with ease
- **Dynamic Arrays**: Add/duplicate array items for repeating structures (e.g., invoice line items)
- **Visual Feedback**: Active field highlighting and selected text preview
- **Export & Save**: Export JSON locally or save to backend

## Tech Stack

**Backend:**
- FastAPI (Python 3.10+)
- PyMuPDF (fitz) for PDF handling
- CORS enabled for frontend communication

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Lucide React for icons
- React Context for state management

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── template.json          # Default JSON template
│   ├── uploads/              # Uploaded PDFs (auto-created)
│   └── outputs/              # Saved JSON files (auto-created)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── contexts/
        │   └── DataContext.jsx    # Global state management
        └── components/
            ├── PDFViewer.jsx      # PDF viewer with text selection
            └── RecursiveTree.jsx  # JSON tree editor
```

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
python main.py
```

The backend will start at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173`

## Usage

1. **Start both servers** (backend on :8000, frontend on :5173)

2. **Open the app** in your browser at `http://localhost:5173`

3. **Upload a PDF** using the "Upload PDF" button on the left panel

4. **Select text** in the PDF by highlighting it - the selected text appears in the top bar

5. **Map text to JSON**:
   - Click a field in the JSON tree to activate it
   - Click the "Map" button to insert selected text
   - Or manually type values

6. **Manage arrays** (line items, etc.):
   - Click "Add" button next to array fields to duplicate the structure
   - Click the trash icon to remove array items

7. **Save your work**:
   - Click "Save" to save JSON to the backend (`backend/outputs/`)
   - Click "Export" to download the JSON locally

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/template` | GET | Get default JSON template |
| `/upload/pdf` | POST | Upload PDF file |
| `/pdf/{file_id}` | GET | Retrieve uploaded PDF |
| `/pdf/{file_id}/text` | GET | Extract text from PDF page |
| `/submit` | POST | Save final JSON data |

## Customizing the Template

Edit `backend/template.json` to define your own data structure. The template supports:
- Primitive types (strings, numbers, booleans)
- Nested objects
- Arrays (first element is used as template for new items)

Example template structure:
```json
{
  "invoice_number": "",
  "date": "",
  "vendor": {
    "name": "",
    "address": ""
  },
  "line_items": [
    {
      "description": "",
      "quantity": 0,
      "price": 0.0
    }
  ],
  "total": 0.0
}
```

## Development

### Backend Development

The backend uses FastAPI with auto-reload enabled. Changes to `main.py` will automatically restart the server.

### Frontend Development

The frontend uses Vite with Hot Module Replacement (HMR). Changes to React components are reflected immediately.

## Production Build

### Frontend Production Build

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Backend Deployment

For production deployment:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or with gunicorn:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## License

MIT
