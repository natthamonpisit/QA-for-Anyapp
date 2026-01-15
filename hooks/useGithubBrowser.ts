
import { useState } from 'react';
import * as GithubService from '../services/githubService';

export const useGithubBrowser = (onFilesImported: (content: string) => void) => {
  const [repoInput, setRepoInput] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userRepos, setUserRepos] = useState<GithubService.GithubRepo[]>([]);
  
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<GithubService.GithubFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const connect = async () => {
    if (!githubToken) return alert("Enter Token");
    setIsLoading(true);
    try {
        const repos = await GithubService.fetchUserRepos(githubToken);
        setUserRepos(repos);
        setIsConnected(true);
        setIsTokenMode(false);
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const disconnect = () => {
    setIsConnected(false);
    setGithubToken('');
    setUserRepos([]);
    setRepoInput('');
    setFiles([]);
    setSelectedPaths(new Set());
  };

  const fetchRepo = async (name?: string) => {
    const target = name || repoInput;
    if (!target) return;
    if (name) setRepoInput(name);
    
    setIsLoading(true);
    setCurrentPath('');
    setSelectedPaths(new Set());
    try {
        const f = await GithubService.fetchRepoContents(target, '', isConnected ? githubToken : undefined);
        setFiles(f);
        setShowBrowser(true);
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const navigate = async (path: string) => {
    setIsLoading(true);
    try {
        const f = await GithubService.fetchRepoContents(repoInput, path, isConnected ? githubToken : undefined);
        setFiles(f);
        setCurrentPath(path);
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  const toggleSelection = (file: GithubService.GithubFile) => {
    if (file.type === 'dir') return;
    const newSet = new Set(selectedPaths);
    if (newSet.has(file.path)) newSet.delete(file.path);
    else newSet.add(file.path);
    setSelectedPaths(newSet);
  };

  const importSelected = async () => {
    if (selectedPaths.size === 0) return;
    setIsLoading(true);
    let buffer = '';
    try {
        for (const path of Array.from(selectedPaths)) {
            const file = files.find(f => f.path === path);
            if (file) {
                const content = await GithubService.fetchFileContent(repoInput, file.sha, isConnected ? githubToken : undefined);
                buffer += `// === FILE: ${file.path} ===\n${content}\n\n`;
            }
        }
        onFilesImported(buffer);
        setSelectedPaths(new Set());
        // Don't close browser automatically if we are in onboarding, handled by parent
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); }
  };

  return {
    state: {
      repoInput, githubToken, isTokenMode, isConnected, userRepos,
      currentPath, files, isLoading, showBrowser, selectedPaths
    },
    actions: {
      setRepoInput, setGithubToken, setIsTokenMode, setShowBrowser,
      connect, disconnect, fetchRepo, navigate, toggleSelection, importSelected
    }
  };
};
