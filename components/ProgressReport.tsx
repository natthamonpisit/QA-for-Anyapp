
import React, { useState } from 'react';
import { FileText, Download, UploadCloud, Settings2, X } from 'lucide-react';
import { CloudinaryConfig } from '../types';

interface ProgressReportProps {
  report: string;
  onUpload: () => void;
  cloudinaryConfig: CloudinaryConfig;
  onUpdateCloudConfig: (config: CloudinaryConfig) => void;
}

const ProgressReport: React.FC<ProgressReportProps> = ({ report, onUpload, cloudinaryConfig, onUpdateCloudConfig }) => {
  const [showConfig, setShowConfig] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA_Report_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] relative overflow-hidden group">
      {/* Mini Action Toolbar (Float on top right) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 p-1 rounded-md border border-slate-700">
            <button 
                onClick={handleDownload}
                className="p-1 hover:text-white text-slate-400 transition-colors"
                title="Download MD"
            >
                <Download className="w-3 h-3" />
            </button>
            <button 
                onClick={onUpload}
                className="p-1 hover:text-blue-400 text-slate-400 transition-colors"
                title="Upload Cloud"
            >
                <UploadCloud className="w-3 h-3" />
            </button>
             <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`p-1 transition-colors ${showConfig ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                title="Settings"
            >
                <Settings2 className="w-3 h-3" />
            </button>
      </div>

      {/* Cloud Config Overlay */}
      {showConfig && (
        <div className="absolute top-0 left-0 right-0 bg-slate-800 p-3 border-b border-slate-600 animate-slideDown z-20 shadow-xl">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xs font-semibold text-slate-300">Cloudinary Config</h3>
                 <button onClick={() => setShowConfig(false)}><X className="w-3 h-3 text-slate-500 hover:text-white"/></button>
            </div>
            <div className="space-y-2">
                <div>
                    <input 
                        type="text" 
                        value={cloudinaryConfig.cloudName}
                        onChange={(e) => onUpdateCloudConfig({ ...cloudinaryConfig, cloudName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                        placeholder="Cloud Name"
                    />
                </div>
                <div>
                    <input 
                        type="text" 
                        value={cloudinaryConfig.uploadPreset}
                        onChange={(e) => onUpdateCloudConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                        placeholder="Upload Preset"
                    />
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <pre className="font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">
          {report || "Report is empty..."}
        </pre>
      </div>
    </div>
  );
};

export default ProgressReport;
