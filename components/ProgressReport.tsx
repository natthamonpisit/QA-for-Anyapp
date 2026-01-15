
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
    <div className="flex flex-col h-full bg-slate-50/5 rounded-lg border border-slate-700/50 overflow-hidden backdrop-blur-sm relative">
      <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-yellow-500" />
            <h2 className="font-semibold text-slate-200 text-sm">Progress Report</h2>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded transition-colors"
                title="Download Markdown"
            >
                <Download className="w-3 h-3" />
            </button>
            <button 
                onClick={onUpload}
                className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded transition-colors"
                title="Upload to Cloudinary"
            >
                <UploadCloud className="w-3 h-3" />
            </button>
             <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`text-[10px] p-1 rounded transition-colors ${showConfig ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Cloud Settings"
            >
                <Settings2 className="w-3 h-3" />
            </button>
        </div>
      </div>

      {/* Cloud Config Overlay */}
      {showConfig && (
        <div className="bg-slate-800 p-3 border-b border-slate-600 animate-slideDown">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xs font-semibold text-slate-300">Cloudinary Configuration</h3>
                 <button onClick={() => setShowConfig(false)}><X className="w-3 h-3 text-slate-500 hover:text-white"/></button>
            </div>
            <div className="space-y-2">
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Cloud Name</label>
                    <input 
                        type="text" 
                        value={cloudinaryConfig.cloudName}
                        onChange={(e) => onUpdateCloudConfig({ ...cloudinaryConfig, cloudName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. demo"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Upload Preset (Unsigned)</label>
                    <input 
                        type="text" 
                        value={cloudinaryConfig.uploadPreset}
                        onChange={(e) => onUpdateCloudConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-blue-500 focus:outline-none"
                        placeholder="e.g. unsigned_upload"
                    />
                </div>
                 <div className="text-[9px] text-slate-500 mt-1">
                    *Settings are saved to your browser's LocalStorage.
                </div>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {report || "Awaiting task execution..."}
        </pre>
      </div>
    </div>
  );
};

export default ProgressReport;
