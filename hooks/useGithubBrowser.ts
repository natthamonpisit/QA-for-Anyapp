
import { useState } from 'react';
import * as GithubService from '../services/githubService';

// Updated interface: content AND repoName
export const useGithubBrowser = (onFilesImported: (content: string, repoName: string) => void) => {
  const [repoInput, setRepoInput] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userRepos, setUserRepos] = useState<GithubService.GithubRepo[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const connect = async () => {
    if (!githubToken) return alert("Enter Token");
    setIsLoading(true);
    setLoadingMessage("Authenticating...");
    try {
        const repos = await GithubService.fetchUserRepos(githubToken);
        setUserRepos(repos);
        setIsConnected(true);
        setIsTokenMode(false);
    } catch (e: any) { alert(e.message); }
    finally { setIsLoading(false); setLoadingMessage(''); }
  };

  const disconnect = () => {
    setIsConnected(false);
    setGithubToken('');
    setUserRepos([]);
    setRepoInput('');
  };

  const autoClone = async (repo: GithubService.GithubRepo) => {
      setRepoInput(repo.full_name);
      setIsLoading(true);
      setLoadingMessage("Analyzing repository structure...");
      try {
          const content = await GithubService.cloneRepoValues(
              repo, 
              isConnected ? githubToken : undefined,
              (msg) => setLoadingMessage(msg)
          );
          // Pass both content and repo name
          onFilesImported(content, repo.full_name);
      } catch (e: any) {
          alert("Failed to clone: " + e.message);
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  };

  // Keep these for backward compatibility or direct usage if needed, but simplified
  const fetchRepo = async () => {}; 
  const navigate = async () => {};
  const toggleSelection = () => {};
  const importSelected = async () => {};

  return {
    state: {
      repoInput, githubToken, isTokenMode, isConnected, userRepos,
      isLoading, loadingMessage, 
      // Legacy props to satisfy interface if needed, or empty
      files: [], currentPath: '', showBrowser: false, selectedPaths: new Set()
    },
    actions: {
      setRepoInput, setGithubToken, setIsTokenMode,
      connect, disconnect, 
      autoClone, // The new main action
      fetchRepo, navigate, toggleSelection, importSelected, setShowBrowser: () => {}
    }
  };
};
