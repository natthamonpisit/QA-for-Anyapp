
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Generic upload function for text-based files (Markdown, TXT, JSON, etc.)
 */
export const uploadFile = async (
  content: string, 
  config: CloudinaryConfig, 
  filename: string, 
  mimeType: string = 'text/plain',
  folder?: string
): Promise<string> => {
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("Missing Cloudinary Configuration");
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`;
  
  // Create a file blob
  const blob = new Blob([content], { type: mimeType });
  const file = new File([blob], filename);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('resource_type', 'raw'); // 'raw' is best for text/md/json files
  
  // Use public_id with slashes to simulate folders
  // e.g. "QA_LOGS/2023-10-27/RepoName/filename"
  if (folder) {
      // Clean repo name for URL safety
      const safeFolder = folder.replace(/[^a-zA-Z0-9-_/]/g, '_');
      const safeFilename = filename.replace(/\.[^/.]+$/, ""); // Remove extension for public_id
      formData.append('public_id', `${safeFolder}/${safeFilename}`);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Return the public URL
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

// Wrapper for backward compatibility if needed, specifically for Report
export const uploadReport = async (content: string, config: CloudinaryConfig, publicId?: string): Promise<string> => {
    const filename = publicId ? `${publicId}.md` : `qa_report_${Date.now()}.md`;
    return uploadFile(content, config, filename, 'text/markdown');
};

/**
 * Specific function to save Cycle Data as JSON with Folder Structure
 * Folder: QA_LOGS / YYYY-MM-DD / Repo_Name / Cycle_X.json
 */
export const uploadCycleData = async (
    data: any, 
    config: CloudinaryConfig, 
    repoName: string, 
    cycleNumber: number
): Promise<string> => {
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const folder = `QA_LOGS/${dateStr}/${repoName}`;
    const filename = `Cycle_${cycleNumber}.json`;
    const content = JSON.stringify(data, null, 2);
    
    return uploadFile(content, config, filename, 'application/json', folder);
};

/**
 * Fetch JSON data back from Cloudinary
 */
export const fetchJson = async (url: string): Promise<any> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch JSON data");
        return await response.json();
    } catch (error) {
        console.error("Fetch JSON Error:", error);
        throw error;
    }
};
