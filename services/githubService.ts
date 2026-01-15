
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
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
};

// ... (Existing Fetch/Clone functions remain the same) ...
export const fetchUserRepos = async (token: string): Promise<GithubRepo[]> => {
  try {
    const response = await fetch(`${BASE_URL}/user/repos?sort=updated&per_page=100`, {
      headers: getHeaders(token)
    });
    if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid Access Token");
        throw new Error(`GitHub API Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch User Repos Error:", error);
    throw error;
  }
};

export const fetchFileContent = async (repoFullName: string, sha: string, token?: string): Promise<string> => {
    try {
        const response = await fetch(`${BASE_URL}/repos/${repoFullName}/git/blobs/${sha}`, {
            headers: getHeaders(token)
        });
        if (!response.ok) throw new Error("Failed to fetch file content.");
        const data = await response.json();
        return atob(data.content.replace(/\n/g, '')); 
    } catch (error) {
        console.error("File Content Error:", error);
        throw error;
    }
};

export const cloneRepoValues = async (repo: GithubRepo, token?: string, onProgress?: (msg: string) => void): Promise<string> => {
  try {
    if (onProgress) onProgress("Fetching file tree...");
    
    const branch = repo.default_branch || 'main';
    const treeResponse = await fetch(`${BASE_URL}/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, {
      headers: getHeaders(token)
    });

    if (!treeResponse.ok) throw new Error("Failed to fetch repository tree");
    const treeData = await treeResponse.json();

    if (treeData.truncated && onProgress) {
       onProgress("Warning: Repo is too large, some files were truncated.");
    }

    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.md', '.py', '.go', '.rs'];
    const ignorePaths = ['node_modules', 'dist', 'build', '.git', 'package-lock.json', 'yarn.lock'];

    const targetFiles = treeData.tree.filter((node: any) => {
        if (node.type !== 'blob') return false; 
        const isRelevantExt = relevantExtensions.some(ext => node.path.endsWith(ext));
        const isIgnored = ignorePaths.some(ignore => node.path.includes(ignore));
        return isRelevantExt && !isIgnored;
    }).slice(0, 40); 

    let fullCode = '';
    let count = 0;
    const BATCH_SIZE = 5;
    for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
        const batch = targetFiles.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async (file: any) => {
             try {
                 const content = await fetchFileContent(repo.full_name, file.sha, token);
                 // Header Format used for parsing later
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

// ==========================================
// NEW: PR & WRITE OPERATIONS (Level 2)
// ==========================================

// 1. Get Reference (SHA of current main)
const getRef = async (repoName: string, branch: string, token: string) => {
  const response = await fetch(`${BASE_URL}/repos/${repoName}/git/ref/heads/${branch}`, {
    headers: getHeaders(token)
  });
  if (!response.ok) throw new Error("Failed to get ref");
  return await response.json();
};

// 2. Create New Branch
const createBranch = async (repoName: string, newBranch: string, sha: string, token: string) => {
  const response = await fetch(`${BASE_URL}/repos/${repoName}/git/refs`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      ref: `refs/heads/${newBranch}`,
      sha: sha
    })
  });
  if (response.status === 422) throw new Error("Branch already exists"); // Handle existing branch
  if (!response.ok) throw new Error("Failed to create branch");
  return await response.json();
};

// 3. Update File (Simplified API)
// Note: For complex multi-file commits, we should use the Git Tree API, but this is sufficient for single-file fixes.
const updateFile = async (repoName: string, filePath: string, content: string, branch: string, token: string, commitMessage: string) => {
  // First, get the file's current SHA (required for update)
  const fileUrl = `${BASE_URL}/repos/${repoName}/contents/${filePath}?ref=${branch}`;
  const getRes = await fetch(fileUrl, { headers: getHeaders(token) });
  
  let sha = undefined;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  // Encode content to Base64 (handling UTF-8)
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  let binary = '';
  for (let i = 0; i < data.length; i++) { binary += String.fromCharCode(data[i]); }
  const base64Content = btoa(binary);

  const body: any = {
    message: commitMessage,
    content: base64Content,
    branch: branch
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(`${BASE_URL}/repos/${repoName}/contents/${filePath}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
     const err = await putRes.json();
     throw new Error(`Commit failed: ${err.message}`);
  }
  return await putRes.json();
};

// 4. Create Pull Request
const createPullRequest = async (repoName: string, title: string, body: string, head: string, base: string, token: string) => {
  const response = await fetch(`${BASE_URL}/repos/${repoName}/pulls`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ title, body, head, base })
  });
  
  if (!response.ok) {
      const err = await response.json();
      // If PR already exists, try to find it
      if (err.errors?.[0]?.message?.includes('A pull request already exists')) {
          return { html_url: `https://github.com/${repoName}/pulls` }; 
      }
      throw new Error(`PR Creation failed: ${err.message}`);
  }
  return await response.json();
};

/**
 * MASTER FUNCTION: Automates the Fix -> Branch -> Commit -> PR flow
 */
export const createFixPR = async (
  repoName: string,
  token: string,
  fileName: string,
  newContent: string,
  taskDescription: string
): Promise<string> => {
  const branchName = `qa-fix-${Date.now()}`;
  const defaultBranch = 'main'; // Assume main for now, could be passed in
  
  try {
    // A. Get Base SHA
    const baseRef = await getRef(repoName, defaultBranch, token);
    
    // B. Create Branch
    await createBranch(repoName, branchName, baseRef.object.sha, token);
    
    // C. Commit Change
    await updateFile(repoName, fileName, newContent, branchName, token, `fix: ${taskDescription} (AI-Generated)`);
    
    // D. Open PR
    const pr = await createPullRequest(
      repoName,
      `[QA-Fix] ${taskDescription}`,
      `This PR was automatically generated by QA Agent.\n\n**Fixes:** ${taskDescription}`,
      branchName,
      defaultBranch,
      token
    );
    
    return pr.html_url;
  } catch (error) {
    console.error("PR Workflow Failed:", error);
    throw error;
  }
};
