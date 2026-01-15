
import React from 'react';
import { useQAWorkflow } from './hooks/useQAWorkflow';
import { useGithubBrowser } from './hooks/useGithubBrowser';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';

export default function App() {
  const qa = useQAWorkflow();
  
  // Bridge Github logic to QA Logic (Code Import)
  const gh = useGithubBrowser((content) => {
      qa.actions.setCode(content); // Use setCode instead of append for clean start
  });

  if (qa.state.currentView === 'ONBOARDING') {
    return <OnboardingView gh={gh} qa={qa} onProceed={() => qa.actions.setView('DASHBOARD')} />;
  }

  return <DashboardView qa={qa} gh={gh} />;
}
