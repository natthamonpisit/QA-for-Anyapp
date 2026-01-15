
import React from 'react';
import { GithubFile } from '../services/githubService';
import { Bug, ArrowLeft, Folder, FileCode, CheckCheck, RotateCw, PlusCircle } from 'lucide-react';

interface FileBrowserProps {
  files: GithubFile[];
  currentPath: string;
  repoName: string;
  selectedPaths: Set<string>;
  isLoading: boolean;
  onNavigate: (path: string) => void;
  onToggle: (file: GithubFile) => void;
  onImport: () => void;
  onClose?: () => void;
  isDashboardMode?: boolean;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ 
  files, currentPath, repoName, selectedPaths, isLoading, 
  onNavigate, onToggle, onImport, onClose, isDashboardMode 
}) => {
  return (
    <div className={`${isDashboardMode ? 'max-h-64' : 'flex-1'} flex flex-col overflow-hidden bg-slate-900/50 rounded border border-slate-700/50`}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700/50 bg-slate-800/30">
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">{repoName}/{currentPath}</span>
            {isDashboardMode && onClose && (
                 <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
                   <Bug className="w-3 h-3 rotate-45" /> 
                 </button>
            )}
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
            {currentPath && (
                <div 
                onClick={() => onNavigate(currentPath.split('/').slice(0, -1).join('/'))}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 cursor-pointer text-slate-400 text-xs rounded mb-1"
                >
                    <ArrowLeft className="w-3 h-3" />
                    <span>..</span>
                </div>
            )}
            
            {files.length === 0 && !isLoading && (
                <div className="text-center text-slate-500 text-xs py-4">No files found.</div>
            )}

            {files.map(file => {
               const isSelected = selectedPaths.has(file.path);
               return (
                <div 
                    key={file.sha}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors group ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-800'}`}
                >
                    <div 
                       onClick={(e) => { e.stopPropagation(); onToggle(file); }}
                       className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                           file.type === 'dir' 
                           ? 'border-transparent' 
                           : isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-slate-400'
                       }`}
                    >
                       {file.type !== 'dir' && isSelected && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>

                    <div 
                        onClick={() => file.type === 'dir' ? onNavigate(file.path) : onToggle(file)}
                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                    >
                        {file.type === 'dir' ? <Folder className="w-3 h-3 text-blue-400 shrink-0" /> : <FileCode className="w-3 h-3 text-yellow-500 shrink-0" />}
                        <span className={`truncate text-xs ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>{file.name}</span>
                    </div>
                </div>
               );
            })}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
            <span className="text-[10px] text-slate-500">{selectedPaths.size} selected</span>
            <button 
                onClick={onImport}
                disabled={selectedPaths.size === 0 || isLoading}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5"
            >
                {isLoading ? <RotateCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                Add
            </button>
        </div>
    </div>
  );
};

export default FileBrowser;
