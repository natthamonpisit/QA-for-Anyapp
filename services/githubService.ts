
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
  default_branch: string;
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
 * Fetches the raw text content of a file.
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

/**
 * NEW: Fetches the Git Tree recursively to get all files, then downloads relevant source code.
 */
export const cloneRepoValues = async (repo: GithubRepo, token?: string, onProgress?: (msg: string) => void): Promise<string> => {
  try {
    if (onProgress) onProgress("Fetching file tree...");
    
    // 1. Get the Tree
    const branch = repo.default_branch || 'main';
    const treeResponse = await fetch(`${BASE_URL}/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, {
      headers: getHeaders(token)
    });

    if (!treeResponse.ok) throw new Error("Failed to fetch repository tree");
    const treeData = await treeResponse.json();

    if (treeData.truncated) {
      if (onProgress) onProgress("Warning: Repo is too large, some files were truncated.");
    }

    // 2. Filter relevant files
    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.md', '.py', '.go', '.rs'];
    const ignorePaths = ['node_modules', 'dist', 'build', '.git', 'package-lock.json', 'yarn.lock'];

    const targetFiles = treeData.tree.filter((node: any) => {
        if (node.type !== 'blob') return false; // files only
        const isRelevantExt = relevantExtensions.some(ext => node.path.endsWith(ext));
        const isIgnored = ignorePaths.some(ignore => node.path.includes(ignore));
        return isRelevantExt && !isIgnored;
    }).slice(0, 40); // LIMIT to 40 files for the demo/context window safety

    // 3. Download Contents
    let fullCode = '';
    let count = 0;

    // Parallel fetch with concurrency limit (simple batching)
    const BATCH_SIZE = 5;
    for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
        const batch = targetFiles.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async (file: any) => {
             try {
                 const content = await fetchFileContent(repo.full_name, file.sha, token);
                 return `// === FILE: ${file.path} ===\n${content}\n\n`;
             } catch (e) {
                 return `// === FILE: ${file.path} (Load Error) ===\n\n`;
             }
        }));
        fullCode += results.join('');
        count += batch.length;
        if (onProgress) onProgress(`Downloaded ${count}/${targetFiles.length} files...`);
    }

    return fullCode;

  } catch (error) {
    console.error("Clone Error:", error);
    throw error;
  }
};
