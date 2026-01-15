
import { GoogleGenAI } from "@google/genai";
import { AgentRole, Task } from "../types";
import { CONFIG } from "../config";

// ==========================================
// GEMINI SERVICE
// ==========================================

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to filter code based on file paths (Smart Context)
const extractRelatedCode = (fullCode: string, filePaths: string[]): string => {
    if (!filePaths || filePaths.length === 0) return fullCode; // Fallback
    
    // Our custom format is "// === FILE: path/to/file ==="
    // We split by this delimiter
    const fileBlocks = fullCode.split('// === FILE: ');
    
    let filteredCode = '';
    
    fileBlocks.forEach(block => {
        if (!block.trim()) return;
        // Re-construct the line
        const lines = block.split('\n');
        const fileName = lines[0].replace(' ===', '').trim();
        
        // Check if this file is in our requested list
        // Partial match allows flexibility (e.g. "utils.ts" matches "src/utils.ts")
        const isRelated = filePaths.some(p => fileName.includes(p));
        
        if (isRelated) {
            filteredCode += `// === FILE: ${fileName} ===\n${lines.slice(1).join('\n')}`;
        }
    });

    // If filtering results in empty (AI hallucinated paths), return full code to be safe
    return filteredCode.trim() ? filteredCode : fullCode;
};

/**
 * 1. ARCHITECT AGENT
 */
export const analyzeCode = async (code: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Role: Senior Software Architect (Thai Language).
    Task: Analyze the provided code to create a "Structural Summary".
    
    Goal:
    - Identify key modules/functions and their dependencies.
    - Summarize logic flow.
    - **List all file paths found in the code.**
    
    Code:
    ${code.substring(0, 70000)} 
    
    Output Format:
    - Markdown formatted.
    - **LANGUAGE: THAI ONLY** (Use English for technical terms).
    - Concise but technical.
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_PRO,
    contents: prompt,
  });

  return response.text || "ไม่สามารถวิเคราะห์โค้ดได้";
};

/**
 * 2. QA LEAD AGENT (Smart Context Enabled)
 * เพิ่ม: ให้ AI ระบุ 'relatedFiles' ในแต่ละ Task
 */
export const createTestPlan = async (code: string, summary: string, currentReport: string): Promise<Task[]> => {
  const ai = getAI();
  const prompt = `
    Role: QA Lead (Thai Language).
    Task: Create granular test tasks based on the summary.
    
    Context:
    1. Code Structure Summary:
    ${summary}
    
    2. Previous Progress Report:
    ${currentReport}

    Constraints:
    - Break tasks into small logic units.
    - Output JSON Array only.
    - **CRITICAL: For each task, list the filenames (relatedFiles) that are relevant to test it.**

    Format:
    [
      { 
        "id": "task_id", 
        "description": "Test requirement X (In Thai)", 
        "expectedResult": "Y (In Thai)",
        "relatedFiles": ["src/App.tsx", "utils/helper.ts"] 
      }
    ]
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_PRO,
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
 * 3. TESTER AGENT (Uses Smart Context & Data Mocking)
 * Updated: เพิ่มคำสั่งให้ AI Mock Data (เช่น รูปภาพ, API Response) เองได้
 */
export const executeTestSimulation = async (fullCode: string, task: Task, currentReport: string): Promise<{ passed: boolean; reason: string }> => {
  const ai = getAI();
  
  // Apply Smart Context (Point A)
  const contextCode = extractRelatedCode(fullCode, task.relatedFiles || []);

  const prompt = `
    Role: QA Tester (Thai Language).
    Task: Execute "Mental Simulation" for Task: "${task.description}".
    
    History:
    ${currentReport}

    Expected Result: ${task.expectedResult}

    Relevant Code Base (Filtered):
    ${contextCode}

    Instructions:
    1. **MOCK DATA**: If the task involves user input (e.g., uploading a file, filling a form), IMAGINE you created a valid mock object.
       - Example: If testing photo upload, assume you created 'const mockFile = { name: "test.jpg", type: "image/jpeg", size: 1024 }'.
    2. **MOCK API**: If the code calls an external API (like Cloudinary, Firebase), DO NOT fail because you cannot reach the internet. 
       - Assume the API returns a standard Success (200 OK) or Error (400/500) based on what you are testing.
    3. **SIMULATE LOGIC**: Trace the code execution flow step-by-step using these mock inputs.
    4. **VALIDATE**: compare the simulated outcome with the Expected Result.

    Output JSON:
    { "passed": boolean, "reason": "Technical explanation in Thai (Mention what data was mocked)" }
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_FLASH,
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
 * 4. FIXER AGENT (Returns Filename + Content for PR)
 */
export const generateFix = async (fullCode: string, task: Task, currentReport: string): Promise<string> => {
  const ai = getAI();
  const contextCode = extractRelatedCode(fullCode, task.relatedFiles || []);

  const prompt = `
    Role: Senior Developer (Fixer) (Thai Language).
    Task: Fix the code based on the FAILED test result.
    
    Failed Task: ${task.description}
    Failure Log: ${task.failureReason}
    
    Relevant Code:
    ${contextCode}

    Instructions:
    - **CRITICAL**: Return the FULL CONTENT of the file that needs changing.
    - If multiple files need changes, choose the most critical one.
    - Start the response with the filename on the first line like: "FILENAME: src/App.tsx"
    - Then the code.
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_FLASH,
    contents: prompt,
  });

  return response.text || "// ไม่สามารถสร้าง Code แก้ไขได้";
};
