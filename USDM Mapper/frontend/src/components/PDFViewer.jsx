import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Memoized Page component to prevent unnecessary re-renders
const VirtualPage = memo(({ pageNum, scale, isVisible, highlightPositions, currentHighlightPage }) => {
  if (!isVisible) {
    // Render placeholder to maintain scroll position
    // Estimate page height based on typical PDF page (612x792 at scale 1 = ~792px)
    const estimatedHeight = 792 * scale;
    return (
      <div 
        className="mb-4 bg-gray-200 rounded flex items-center justify-center"
        style={{ height: `${estimatedHeight}px`, width: `${612 * scale}px` }}
      >
        <span className="text-gray-400 text-sm">Page {pageNum}</span>
      </div>
    );
  }

  return (
    <div className="relative mb-4">
      <Page
        pageNumber={pageNum}
        scale={scale}
        renderAnnotationLayer={false}
        renderTextLayer={true}
        className="shadow-lg"
        loading={
          <div className="bg-gray-100 rounded flex items-center justify-center" style={{ height: `${792 * scale}px`, width: `${612 * scale}px` }}>
            <span className="text-gray-400 text-sm">Loading...</span>
          </div>
        }
      />
      
      {/* Highlight Overlay for this page */}
      {highlightPositions.length > 0 && pageNum === currentHighlightPage && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ top: 0, left: 0 }}
        >
          {highlightPositions.map((item, idx) => {
            const viewport = item.viewport || { width: 612, height: 792 };
            const pageHeight = viewport.height * scale;
            const [a, b, c, d, e, f] = item.transform;
            const cssTop = pageHeight - (f * scale) - (item.height * scale);
            const cssLeft = e * scale;
            
            return (
              <div
                key={idx}
                className="absolute bg-yellow-300 opacity-60 rounded-sm"
                style={{
                  top: `${cssTop}px`,
                  left: `${cssLeft}px`,
                  width: `${item.width * scale}px`,
                  height: `${item.height * scale}px`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

const PDFViewer = ({ onTextSelection }) => {
  const { pdfFile, setPdfFile } = useData();
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pdfData, setPdfData] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfProxy, setPdfProxy] = useState(null);
  
  // Virtual scroll state
  const [visiblePages, setVisiblePages] = useState(new Set([1]));
  const pageRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const BUFFER_SIZE = 2; // Render 2 pages before and after visible area
  
  // Search state with highlight positions
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightPositions, setHighlightPositions] = useState([]);
  const [currentHighlightPage, setCurrentHighlightPage] = useState(null);

  // Virtual scroll with IntersectionObserver
  useEffect(() => {
    if (!numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const newVisible = new Set(prev);
          
          entries.forEach((entry) => {
            const pageNum = parseInt(entry.target.dataset.page);
            if (entry.isIntersecting) {
              newVisible.add(pageNum);
              // Also add buffer pages
              for (let i = Math.max(1, pageNum - BUFFER_SIZE); i <= Math.min(numPages, pageNum + BUFFER_SIZE); i++) {
                newVisible.add(i);
              }
            } else {
              // Check if page is far from viewport before removing
              let isNearViewport = false;
              for (let i = Math.max(1, pageNum - BUFFER_SIZE * 2); i <= Math.min(numPages, pageNum + BUFFER_SIZE * 2); i++) {
                if (newVisible.has(i)) {
                  isNearViewport = true;
                  break;
                }
              }
              if (!isNearViewport) {
                newVisible.delete(pageNum);
              }
            }
          });
          
          return newVisible;
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    // Observe all page placeholders
    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages, scale]);
  useEffect(() => {
    if (pdfFile?.url) {
      const fullUrl = pdfFile.url.startsWith('http') 
        ? pdfFile.url 
        : `http://localhost:8000${pdfFile.url}`;
      setPdfData(fullUrl);
    }
  }, [pdfFile]);

  const goToPage = (page) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      // Ensure page is visible for virtual scroll
      setVisiblePages((prev) => {
        const newVisible = new Set(prev);
        newVisible.add(page);
        // Add buffer pages around target
        for (let i = Math.max(1, page - BUFFER_SIZE); i <= Math.min(numPages, page + BUFFER_SIZE); i++) {
          newVisible.add(i);
        }
        return newVisible;
      });
      // Scroll to the page
      setTimeout(() => {
        const pageEl = pageRefs.current[page];
        if (pageEl && scrollContainerRef.current) {
          pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      // Clear highlights when manually navigating to different page
      if (page !== currentHighlightPage) {
        setHighlightPositions([]);
      }
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text && onTextSelection) {
      onTextSelection(text);
    }
  }, [onTextSelection]);

  // Search through PDF and capture highlight positions
  const performSearch = async () => {
    if (!pdfProxy || !searchQuery.trim()) {
      console.log('Cannot search:', { pdfProxy: !!pdfProxy, searchQuery });
      return;
    }
    
    setIsSearching(true);
    const results = [];
    const query = searchQuery.toLowerCase();
    
    try {
      console.log('Searching in', pdfProxy.numPages, 'pages');
      for (let pageNum = 1; pageNum <= pdfProxy.numPages; pageNum++) {
        const page = await pdfProxy.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ').toLowerCase();
        
        if (pageText.includes(query)) {
          results.push(pageNum);
          console.log('Found match on page', pageNum);
        }
        page.cleanup();
      }
      
      setSearchResults(results);
      if (results.length > 0) {
        setCurrentMatchIndex(0);
        const firstPage = results[0];
        setCurrentHighlightPage(firstPage);
        goToPage(firstPage);
        // Load highlights for the first match page
        loadHighlightsForPage(firstPage, query);
      } else {
        console.log('No matches found');
        setHighlightPositions([]);
        setCurrentHighlightPage(null);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    setIsSearching(false);
  };

  // Load highlight positions for a specific page with viewport info
  const loadHighlightsForPage = async (pageNum, query) => {
    if (!pdfProxy || !query) return;
    
    try {
      const page = await pdfProxy.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const queryLower = query.toLowerCase();
      
      const highlights = [];
      
      // Check each text item for matches
      textContent.items.forEach((item, index) => {
        const itemText = item.str.toLowerCase();
        if (itemText.includes(queryLower)) {
          // Store the transform matrix, dimensions and viewport for highlighting
          highlights.push({
            index,
            text: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
            viewport: { width: viewport.width, height: viewport.height }
          });
        }
      });
      
      setHighlightPositions(highlights);
      setCurrentHighlightPage(pageNum);
      page.cleanup();
    } catch (err) {
      console.error('Error loading highlights:', err);
    }
  };

  const goToNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIndex);
    const pageNum = searchResults[nextIndex];
    // Ensure page is visible before navigating
    setVisiblePages((prev) => {
      const newVisible = new Set(prev);
      newVisible.add(pageNum);
      for (let i = Math.max(1, pageNum - BUFFER_SIZE); i <= Math.min(numPages, pageNum + BUFFER_SIZE); i++) {
        newVisible.add(i);
      }
      return newVisible;
    });
    setCurrentPage(pageNum);
    setCurrentHighlightPage(pageNum);
    // Scroll to page and load highlights
    setTimeout(() => {
      const pageEl = pageRefs.current[pageNum];
      if (pageEl && scrollContainerRef.current) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      loadHighlightsForPage(pageNum, searchQuery.toLowerCase());
    }, 100);
  };

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentMatchIndex <= 0 ? searchResults.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    const pageNum = searchResults[prevIndex];
    // Ensure page is visible before navigating
    setVisiblePages((prev) => {
      const newVisible = new Set(prev);
      newVisible.add(pageNum);
      for (let i = Math.max(1, pageNum - BUFFER_SIZE); i <= Math.min(numPages, pageNum + BUFFER_SIZE); i++) {
        newVisible.add(i);
      }
      return newVisible;
    });
    setCurrentPage(pageNum);
    setCurrentHighlightPage(pageNum);
    // Scroll to page and load highlights
    setTimeout(() => {
      const pageEl = pageRefs.current[pageNum];
      if (pageEl && scrollContainerRef.current) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      loadHighlightsForPage(pageNum, searchQuery.toLowerCase());
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentMatchIndex(-1);
    setHighlightPositions([]);
    setCurrentHighlightPage(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar with Search */}
      {pdfFile && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 bg-white border-b border-gray-200 flex-wrap">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-700 font-medium min-w-[100px] text-center">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              showSearch ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search size={16} />
            Search
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-4">
            <button
              onClick={zoomOut}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-gray-600 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && pdfFile && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border-b border-primary-100">
          <Search size={16} className="text-primary-600" />
          <input
            type="text"
            placeholder="Search in PDF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={performSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isSearching ? '...' : 'Find'}
          </button>
          {searchResults.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {currentMatchIndex + 1} / {searchResults.length}
              </span>
              <button
                onClick={goToPrevMatch}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Previous match"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={goToNextMatch}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                title="Next match"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <button
            onClick={clearSearch}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Clear search"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* PDF Content - Virtual Scroll */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4" onMouseUp={handleTextSelection}>
        {pdfData ? (
          <div className="flex flex-col items-center gap-4">
            <Document
              file={pdfData}
              onLoadSuccess={(pdf) => {
                setNumPages(pdf.numPages);
                setPdfProxy(pdf);
                console.log('PDF loaded for search, pages:', pdf.numPages);
              }}
              loading={
                <div className="flex items-center justify-center h-96">
                  <span className="text-gray-400">Loading PDF...</span>
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div 
                  key={pageNum} 
                  ref={(el) => { pageRefs.current[pageNum] = el; }}
                  data-page={pageNum}
                  className="relative"
                >
                  <VirtualPage
                    pageNum={pageNum}
                    scale={scale}
                    isVisible={visiblePages.has(pageNum)}
                    highlightPositions={highlightPositions}
                    currentHighlightPage={currentHighlightPage}
                  />
                </div>
              ))}
            </Document>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText size={48} className="mb-3" />
            <p className="text-sm">No PDF loaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
