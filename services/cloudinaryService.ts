
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
  mimeType: string = 'text/plain'
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
  
  // Note: We don't force public_id here to allow Cloudinary to handle duplicates or versioning
  // unless we specifically want to overwrite. For logs, unique timestamps are better.

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
