// Function to interact with GitHub API

export interface GithubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  url: string;
  download_url: string | null;
}

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

const BASE_URL = 'https://api.github.com';

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
};

/**
 * Fetches the repositories of the authenticated user.
 */
export const fetchUserRepos = async (token: string): Promise<GithubRepo[]> => {
  try {
    // Get user repos (sorted by updated)
    const response = await fetch(`${BASE_URL}/user/repos?sort=updated&per_page=100`, {
      headers: getHeaders(token)
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid Access Token");
        throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch User Repos Error:", error);
    throw error;
  }
};

/**
 * Fetches the content of a specific path in a repository.
 * If path is empty, it fetches the root directory.
 */
export const fetchRepoContents = async (repoFullName: string, path: string = '', token?: string): Promise<GithubFile[]> => {
  // repoFullName example: "owner/repo"
  try {
    const response = await fetch(`${BASE_URL}/repos/${repoFullName}/contents/${path}`, {
       headers: getHeaders(token)
    });
    
    if (!response.ok) {
      if (response.status === 404) throw new Error("Repository or path not found.");
      if (response.status === 403) throw new Error("Access Denied or Rate limit exceeded.");
      if (response.status === 401) throw new Error("Unauthorized (Check Token).");
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ensure we return an array (API returns object for single file, array for dir)
    if (Array.isArray(data)) {
        // Sort: Directories first, then files
        return data.sort((a: GithubFile, b: GithubFile) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'dir' ? -1 : 1;
        });
    }
    return [data];
  } catch (error) {
    console.error("GitHub Fetch Error:", error);
    throw error;
  }
};

/**
 * Fetches the raw text content of a file.
 * Uses the API blob endpoint to avoid CORS issues sometimes associated with raw.githubusercontent.com
 */
export const fetchFileContent = async (repoFullName: string, sha: string, token?: string): Promise<string> => {
    try {
        const response = await fetch(`${BASE_URL}/repos/${repoFullName}/git/blobs/${sha}`, {
            headers: getHeaders(token)
        });
        if (!response.ok) throw new Error("Failed to fetch file content.");
        
        const data = await response.json();
        // GitHub API returns content in Base64
        return atob(data.content.replace(/\n/g, '')); // Decode Base64
    } catch (error) {
        console.error("File Content Error:", error);
        throw error;
    }
};
