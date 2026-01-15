
export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export const uploadReport = async (content: string, config: CloudinaryConfig, publicId?: string): Promise<string> => {
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error("Missing Cloudinary Configuration");
  }

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/upload`;
  
  // Create a file blob
  const blob = new Blob([content], { type: 'text/markdown' });
  // Use publicId if provided to attempt overwrite (requires preset settings), otherwise timestamp
  const filename = publicId ? `${publicId}.md` : `qa_report_${Date.now()}.md`;
  const file = new File([blob], filename);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  formData.append('resource_type', 'raw'); // 'raw' is best for text/md files
  
  if (publicId) {
      formData.append('public_id', publicId);
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
