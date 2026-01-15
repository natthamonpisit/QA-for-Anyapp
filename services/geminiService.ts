
import { GoogleGenAI } from "@google/genai";
import { AgentRole, Task } from "../types";
import { CONFIG } from "../config";

// Helper to ensure API Key exists
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * 1. ARCHITECT AGENT
 * Creates a "Map" of the code to save context for later agents.
 */
export const analyzeCode = async (code: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Role: Senior Software Architect (Thai Language).
    Task: Analyze the provided code to create a "Structural Summary".
    
    Goal:
    - Identify key modules/functions and their dependencies.
    - Summarize logic flow.
    - This summary will be used by QA Agents so they understand the system WITHOUT reading the full code every time.
    
    Code:
    ${code}
    
    Output Format:
    - Markdown formatted.
    - **LANGUAGE: THAI ONLY** (Use English for technical terms/variable names where appropriate).
    - Concise but technical.
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    contents: prompt,
  });

  return response.text || "ไม่สามารถวิเคราะห์โค้ดได้";
};

/**
 * 2. QA LEAD AGENT
 * Uses the Summary + Code + Previous Report to plan tasks.
 */
export const createTestPlan = async (code: string, summary: string, currentReport: string): Promise<Task[]> => {
  const ai = getAI();
  const prompt = `
    Role: QA Lead (Thai Language).
    Task: Create granular test tasks.
    
    Context:
    1. Code Structure Summary:
    ${summary}
    
    2. Previous Progress Report (Avoid repeating finished work):
    ${currentReport}

    Constraints:
    - Break tasks into small logic units.
    - If this is a regression cycle, focus on previously failed areas mentioned in the Report.
    - Output JSON Array only.

    Format:
    [
      { "id": "task_id", "description": "Test requirement X (In Thai)", "expectedResult": "Y (In Thai)" }
    ]

    Code (Reference):
    ${code.substring(0, 50000)} // Truncate if too massive, rely on summary
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    const tasks = JSON.parse(response.text || "[]");
    return tasks.map((t: any) => ({ ...t, status: 'PENDING' }));
  } catch (e) {
    console.error("Failed to parse task JSON", e);
    return [];
  }
};

/**
 * 3. TESTER AGENT
 * Validates a single task against the code. Reads the Report to know context.
 */
export const executeTestSimulation = async (code: string, task: Task, currentReport: string): Promise<{ passed: boolean; reason: string }> => {
  const ai = getAI();
  
  const prompt = `
    Role: QA Tester (Thai Language).
    Task: Execute Mental Simulation for Task: "${task.description}".
    
    History (Progress Report):
    ${currentReport}

    Expected Result: ${task.expectedResult}

    Code Base:
    ${code}

    Instructions:
    1. Locate the relevant function/logic in the Code Base.
    2. Simulate inputs/execution flow.
    3. Check against Expected Result.
    4. If it fails, explain WHY specifically (Logic error? Syntax? Missing handling?).
    5. **Response MUST be in THAI**.

    Output JSON:
    { "passed": boolean, "reason": "Technical explanation in Thai" }
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || '{ "passed": false, "reason": "AI Error" }');
  } catch (e) {
    return { passed: false, reason: "ไม่สามารถประมวลผลการทดสอบได้" };
  }
};

/**
 * 4. FIXER AGENT
 * Proposes a fix. MUST read the failure reason from the Report/Task.
 */
export const generateFix = async (code: string, task: Task, currentReport: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Role: Senior Developer (Fixer) (Thai Language).
    Task: Fix the code based on the FAILED test result.
    
    Failed Task: ${task.description}
    Failure Log: ${task.failureReason}
    
    Context from Report:
    ${currentReport}

    Original Code:
    ${code}

    Instructions:
    - Return ONLY the corrected code snippet/function.
    - Do not break other parts of the app (Regression awareness).
    - Add comments explaining the fix in Thai.
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
    contents: prompt,
  });

  return response.text || "// ไม่สามารถสร้าง Code แก้ไขได้";
};
