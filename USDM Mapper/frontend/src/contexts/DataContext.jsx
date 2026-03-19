import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [selectedText, setSelectedText] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const updateJsonValue = useCallback((path, value) => {
    setJsonData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  }, []);

  const addArrayItem = useCallback((path) => {
    setJsonData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      if (Array.isArray(current) && current.length > 0) {
        const template = JSON.parse(JSON.stringify(current[0]));
        current.push(template);
      }
      
      return newData;
    });
  }, []);

  const removeArrayItem = useCallback((path, index) => {
    setJsonData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      
      if (Array.isArray(current) && current.length > 1) {
        current.splice(index, 1);
      }
      
      return newData;
    });
  }, []);

  const mapSelectedText = useCallback((path) => {
    if (selectedText) {
      updateJsonValue(path, selectedText);
      setActiveField(null);
    }
  }, [selectedText, updateJsonValue]);

  return (
    <DataContext.Provider value={{
      selectedText,
      setSelectedText,
      jsonData,
      setJsonData,
      activeField,
      setActiveField,
      pdfFile,
      setPdfFile,
      updateJsonValue,
      addArrayItem,
      removeArrayItem,
      mapSelectedText
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
