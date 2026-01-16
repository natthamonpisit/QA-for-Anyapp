
export enum AgentRole {
  ARCHITECT = 'ARCHITECT', // Reads code, summarizes logic
  QA_LEAD = 'QA_LEAD',     // Breaks down tasks
  TESTER = 'TESTER',       // Simulates execution & validates
  FIXER = 'FIXER',         // Proposes fixes
  SYSTEM = 'SYSTEM',       // New: For internal system logs
}

export enum TaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export interface Task {
  id: string;
  description: string;
  expectedResult: string;
  status: TaskStatus;
  resultLog?: string;
  failureReason?: string;
  fixSuggestion?: string;
  relatedFiles?: string[]; // Point A: Identify relevant files for context optimization
  prUrl?: string;          // Point B: Link to the created Pull Request
  executionLogs?: string[]; // Point C: Detailed step-by-step logs from the AI Simulation
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  role: AgentRole;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  source?: string; // e.g., 'GeminiService', 'GithubService', 'Reducer'
  details?: any;   // e.g., full error object or API response payload
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface RepoCatalogItem {
  id: string; // repo full name e.g., "user/repo"
  name: string;
  description: string;
  lastAnalyzed: string; // ISO Date
  summarySnippet: string;
  savedState?: Partial<AppState>; 
}

export interface CycleHistoryItem {
  cycleNumber: number;
  defectCount: number;
  timestamp: string;
  storageUrl?: string; // URL to the JSON file on Cloudinary
  tasks?: Task[]; // Optional: Can be cleared from memory to save space
}

export interface AppState {
  currentRepoName: string; 
  codeContext: string;
  functionSummary: string;
  tasks: Task[];
  logs: LogEntry[];
  progressReport: string; 
  isProcessing: boolean;
  currentCycle: number;
  maxCycles: number;
  workflowStep: 'IDLE' | 'ANALYZING' | 'PLANNING' | 'TESTING' | 'FIXING' | 'REGRESSION_CHECK' | 'COMPLETED';
  currentView: 'ONBOARDING' | 'DASHBOARD'; 
  cloudinaryConfig: CloudinaryConfig; 
  sessionId: string; 
  repoCatalog: RepoCatalogItem[]; 
  showDebugConsole: boolean;
  
  // History Feature
  cycleHistory: CycleHistoryItem[];
  viewingCycle: number | null; // null = Live/Current, number = specific cycle
  viewingCycleData: Task[] | null; // Stores the loaded tasks for the viewing cycle
}
