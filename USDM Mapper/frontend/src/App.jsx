import { useState, useEffect } from 'react';
import React from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import PDFViewer from './components/PDFViewer';
import RecursiveTree from './components/RecursiveTree';
import { Upload, FileJson, FileText, CheckCircle, X, Save, Eye, EyeOff } from 'lucide-react';

// New Project Screen Component
const NewProjectScreen = ({ onProjectCreated }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid PDF file');
    }
  };

  const handleTemplateSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.json')) {
      setTemplateFile(file);
      setError('');
    } else if (file) {
      setError('Please select a valid JSON template file');
    }
  };

  const handleCreateProject = async () => {
    if (!pdfFile || !templateFile) {
      setError('Both PDF and Template files are required');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Upload both files together
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('template', templateFile);
      
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Upload failed');
      }
      
      const data = await response.json();

      onProjectCreated({
        pdf: {
          id: data.project_id,
          filename: data.pdf_filename,
          url: `http://localhost:8000/pdf/${data.project_id}`,
          pageCount: data.page_count
        },
        template: data.template
      });
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-4">
              <FileJson size={32} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">USDM Mapper</h1>
            <p className="text-gray-500">Upload a PDF and a JSON template to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <X size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* PDF Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <FileText size={24} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">PDF Document</h3>
                  <p className="text-sm text-gray-500 mb-3">Upload the PDF you want to extract data from</p>
                  
                  {pdfFile ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FileText size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{pdfFile.name}</span>
                      <button 
                        onClick={() => setPdfFile(null)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                      <Upload size={16} />
                      <span className="text-sm font-medium">Select PDF</span>
                      <input type="file" accept=".pdf" onChange={handlePdfSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Template Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileJson size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">JSON Template</h3>
                  <p className="text-sm text-gray-500 mb-3">Upload the template structure for your data</p>
                  
                  {templateFile ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FileJson size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{templateFile.name}</span>
                      <button 
                        onClick={() => setTemplateFile(null)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                      <Upload size={16} />
                      <span className="text-sm font-medium">Select Template</span>
                      <input type="file" accept=".json" onChange={handleTemplateSelect} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreateProject}
              disabled={!pdfFile || !templateFile || isUploading}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div> // <-- THIS WAS THE MISSING CLOSING DIV!
  );
};

// Main App Content with Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <pre className="bg-gray-100 p-4 rounded text-left text-sm overflow-auto">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { jsonData, setJsonData, pdfFile, setPdfFile, selectedText, setSelectedText } = useData();
  const [hasProject, setHasProject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('pdfJsonSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.pdfFile && session.jsonData) {
          setPdfFile(session.pdfFile);
          setJsonData(session.jsonData);
          setHasProject(true);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem('pdfJsonSession');
      }
    }
    setIsRestoring(false);
  }, [setPdfFile, setJsonData]);

  // Save session to localStorage when project is created or data changes
  useEffect(() => {
    if (hasProject && pdfFile && jsonData) {
      const session = {
        pdfFile,
        jsonData,
        timestamp: Date.now()
      };
      localStorage.setItem('pdfJsonSession', JSON.stringify(session));
    }
  }, [hasProject, pdfFile, jsonData]);

  const handleProjectCreated = ({ pdf, template }) => {
    setPdfFile(pdf);
    setJsonData(template);
    setHasProject(true);
    // Save immediately
    localStorage.setItem('pdfJsonSession', JSON.stringify({
      pdfFile: pdf,
      jsonData: template,
      timestamp: Date.now()
    }));
  };

  const handleTextSelection = (text) => {
    setSelectedText(text);
  };

  const handleSubmitAndDownload = async () => {
    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      // 1. Download locally
      const dataStr = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'extracted-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 2. Send to backend
      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) throw new Error('Submit failed');

      const result = await response.json();
      console.log('Saved to backend:', result.filename);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save JSON');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewProject = () => {
    setHasProject(false);
    setPdfFile(null);
    setJsonData(null);
    setSelectedText('');
    localStorage.removeItem('pdfJsonSession');
  };

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Restoring session...</div>
      </div>
    );
  }

  if (!hasProject) {
    return <NewProjectScreen onProjectCreated={handleProjectCreated} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 relative">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileJson size={20} className="text-primary-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">USDM Mapper</h1>
                <p className="text-xs text-gray-500">Select text and map to JSON fields</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedText && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm">
                <span className="truncate max-w-[200px]">"{selectedText}"</span>
                <button onClick={() => setSelectedText('')} className="hover:text-primary-900">
                  <X size={14} />
                </button>
              </div>
            )}

            <button
              onClick={handleNewProject}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              New Project
            </button>

            {/* Focus Mode Toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border
                ${focusMode
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {focusMode ? <EyeOff size={16} /> : <Eye size={16} />}
              Focus Mode
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Dynamic Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane - PDF Viewer */}
        <div className={`${focusMode ? 'w-full' : 'w-[60%]'} ${!focusMode ? 'border-r border-gray-300' : ''} transition-all duration-300`}>
          <PDFViewer onTextSelection={handleTextSelection} />
        </div>

        {/* Right Pane - JSON Tree (hidden in focus mode) */}
        {!focusMode && (
          <div className="w-[40%] bg-white flex flex-col transition-all duration-300">
            <RecursiveTree />
          </div>
        )}
      </main>

      {/* Floating Submit & Save Button */}
      <button
        onClick={handleSubmitAndDownload}
        disabled={isSubmitting || !jsonData}
        className={`
          fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-full shadow-lg transition-all z-50
          ${submitSuccess
            ? 'bg-green-600 text-white shadow-green-200'
            : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-primary-200'
          }
        `}
      >
        {submitSuccess ? (
          <>
            <CheckCircle size={18} />
            Saved!
          </>
        ) : (
          <>
            <Save size={18} />
            {isSubmitting ? 'Saving...' : 'Submit & Save'}
          </>
        )}
      </button>
    </div>
  );
};

function App() {
  return (
    <DataProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </DataProvider>
  );
}

export default App;