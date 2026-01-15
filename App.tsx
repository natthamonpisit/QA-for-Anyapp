
import React from 'react';
import { useQAWorkflow } from './hooks/useQAWorkflow';
import { useGithubBrowser } from './hooks/useGithubBrowser';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';

export default function App() {
  const qa = useQAWorkflow();
  
  // Bridge Github logic to QA Logic (Code Import + Repo Name)
  const gh = useGithubBrowser((content, repoName) => {
      // Use setRepoContext to store both the code and the repo identity
      qa.actions.setRepoContext(repoName, content); 
  });

  if (qa.state.currentView === 'ONBOARDING') {
    return <OnboardingView gh={gh} qa={qa} onProceed={() => qa.actions.setView('DASHBOARD')} />;
  }

  return <DashboardView qa={qa} gh={gh} />;
}
