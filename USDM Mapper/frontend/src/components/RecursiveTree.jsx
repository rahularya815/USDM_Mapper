import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, MapPin, Type, Hash, Braces, List, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const getValueType = (value) => {
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'unknown';
};

const TypeIcon = ({ type }) => {
  const iconProps = { size: 14, className: 'text-gray-400' };
  switch (type) {
    case 'string': return <Type {...iconProps} />;
    case 'number': return <Hash {...iconProps} />;
    case 'object': return <Braces {...iconProps} />;
    case 'array': return <List {...iconProps} />;
    default: return <Type {...iconProps} />;
  }
};

const RecursiveTreeNode = ({ name, value, path, depth = 0, searchTerm, isParentMatched }) => {
  const {
    selectedText,
    activeField,
    setActiveField,
    updateJsonValue,
    addArrayItem,
    removeArrayItem,
    mapSelectedText
  } = useData();

  const [isExpanded, setIsExpanded] = useState(false);
  const valueType = getValueType(value);
  const currentPath = [...path, name];
  const isActive = activeField === currentPath.join('.');

  // Check if this node matches search
  const matchesSearch = searchTerm && name.toLowerCase().includes(searchTerm.toLowerCase());
  const shouldShow = !searchTerm || matchesSearch || isParentMatched;

  const handleFieldClick = () => {
    if (valueType === 'string' || valueType === 'number') {
      setActiveField(currentPath.join('.'));
    }
  };

  const handleMapClick = (e) => {
    e.stopPropagation();
    mapSelectedText(currentPath);
  };

  const handleValueChange = (e) => {
    const newValue = valueType === 'number'
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    updateJsonValue(currentPath, newValue);
  };

  const handleAddItem = (e) => {
    e.stopPropagation();
    addArrayItem(currentPath);
  };

  const handleRemoveItem = (e, index) => {
    e.stopPropagation();
    removeArrayItem(path, index);
  };

  const paddingLeft = depth * 16;

  // Render primitive value (string, number)
  if (valueType !== 'object' && valueType !== 'array') {
    if (!shouldShow) return null;

    return (
      <div
        className={`
          group flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all
          ${isActive ? 'bg-primary-100 ring-2 ring-primary-500' : matchesSearch ? 'bg-yellow-100' : 'hover:bg-gray-50'}
          ${selectedText ? 'cursor-pointer' : ''}
        `}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onClick={handleFieldClick}
      >
        <TypeIcon type={valueType} />
        <span className={`text-sm font-medium min-w-[120px] ${matchesSearch ? 'text-yellow-800' : 'text-gray-700'}`}>
          {name}:
        </span>

        {isActive ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type={valueType === 'number' ? 'number' : 'text'}
              value={value}
              onChange={handleValueChange}
              className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              onBlur={() => setActiveField(null)}
              onKeyDown={(e) => e.key === 'Enter' && setActiveField(null)}
            />
            {selectedText && (
              <button
                onClick={handleMapClick}
                className="flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors"
                title="Map selected text"
              >
                <MapPin size={12} />
                Map
              </button>
            )}
          </div>
        ) : (
          <span className="flex-1 text-sm text-gray-600 truncate">
            {String(value) || <span className="text-gray-400 italic">empty</span>}
          </span>
        )}

        {!isActive && selectedText && (
          <button
            onClick={handleMapClick}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-all"
          >
            <MapPin size={12} />
            Map
          </button>
        )}
      </div>
    );
  }

  // Render object or array
  const isArray = valueType === 'array';
  const entries = isArray ? value : Object.entries(value);

  // Filter children for objects
  const childNodes = isArray ? entries : entries.filter(([key]) => 
    !searchTerm || key.toLowerCase().includes(searchTerm.toLowerCase()) || isParentMatched || matchesSearch
  );

  // Don't render if no children match and this node doesn't match
  if (searchTerm && !matchesSearch && !isParentMatched && childNodes.length === 0) {
    return null;
  }

  return (
    <div className="select-none">
      {shouldShow && (
        <div
          className={`
            flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all
            ${matchesSearch ? 'bg-yellow-100' : 'hover:bg-gray-50'}
          `}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <button className="p-0.5 rounded hover:bg-gray-200 transition-colors">
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500" />
            ) : (
              <ChevronRight size={16} className="text-gray-500" />
            )}
          </button>

          <TypeIcon type={valueType} />

          <span className={`text-sm font-semibold ${matchesSearch ? 'text-yellow-800' : 'text-gray-800'}`}>
            {name}
          </span>

          <span className="text-xs text-gray-400">
            {isArray ? `[${entries.length} items]` : `{${Object.keys(value).length} fields}`}
          </span>

          {isArray && (
            <button
              onClick={handleAddItem}
              className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          )}
        </div>
      )}

      {(isExpanded || searchTerm) && (
        <div className="mt-0.5">
          {isArray ? (
            entries.map((item, index) => (
              <div key={index} className="relative">
                <div
                  className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-200"
                  style={{ marginLeft: `${paddingLeft + 20}px` }}
                />
                <div className="flex items-center">
                  <RecursiveTreeNode
                    name={`[${index}]`}
                    value={item}
                    path={[...currentPath]}
                    depth={depth + 1}
                    searchTerm={searchTerm}
                    isParentMatched={matchesSearch || isParentMatched}
                  />
                  {shouldShow && entries.length > 1 && (
                    <button
                      onClick={(e) => handleRemoveItem(e, index)}
                      className="mr-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            childNodes.map(([key, val]) => (
              <RecursiveTreeNode
                key={key}
                name={key}
                value={val}
                path={currentPath}
                depth={depth + 1}
                searchTerm={searchTerm}
                isParentMatched={matchesSearch || isParentMatched}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const RecursiveTree = () => {
  const { jsonData } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <Braces size={48} className="mb-4" />
        <p className="text-center">
          {!jsonData ? 'Loading template...' : 'Invalid template: must be an object, not an array'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1">
          {Object.entries(jsonData).map(([key, value]) => (
            <RecursiveTreeNode
              key={key}
              name={key}
              value={value}
              path={[]}
              depth={0}
              searchTerm={searchTerm}
              isParentMatched={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecursiveTree;
