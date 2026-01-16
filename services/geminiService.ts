
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
        // CRITICAL FIX: Add check for fileName existence and validity
        const isRelated = fileName && filePaths.some(p => p && fileName.includes(p));
        
        if (isRelated) {
            filteredCode += `// === FILE: ${fileName} ===\n${lines.slice(1).join('\n')}`;
        }
    });

    // If filtering results in empty (AI hallucinated paths), return full code to be safe
    return filteredCode.trim() ? filteredCode : fullCode;
};

/**
 * 1. ARCHITECT AGENT
 * Update: Enhanced to analyze Inputs, Outputs, Security Risks, and Error Handling.
 */
export const analyzeCode = async (code: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Role: Senior Software Architect (Thai Language).
    Task: Analyze the provided code to create a "Technical Structural Summary".
    
    Analysis Requirements:
    1. **Modules & Logic**: Identify key functions and dependencies.
    2. **Data Flow**: Analyze critical INPUTS required and OUTPUTS expected.
    3. **Risk Assessment**: Identify potential SECURITY RISKS (e.g., injection, sensitive data) or Logic Gaps.
    4. **Negative Scenarios**: Suggest areas where invalid inputs or edge cases might break the app.
    5. **Error Handling**: Evaluate how errors are shown to the user (User Feedback).
    
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
 * Update: Returns reasoning + tasks. Enforces 5 Golden Rules & 3 Dimensions Coverage.
 */
export const createTestPlan = async (code: string, summary: string, currentReport: string): Promise<{ tasks: Task[], reasoning: string }> => {
  const ai = getAI();
  const prompt = `
    Role: Professional QA Lead (Thai Language).
    Task: Create a comprehensive Test Matrix adhering to strict professional standards.
    
    Context:
    1. Code Structure Summary:
    ${summary}
    
    2. Previous Progress Report:
    ${currentReport}

    STRICT GUIDELINES: "The 5 Golden Rules" (ต้องปฏิบัติตามอย่างเคร่งครัด):
    1. **One Scenario = One Objective**: หนึ่งข้อ หนึ่งเป้าหมาย ห้ามเทสหลายเรื่องในข้อเดียว ถ้าซับซ้อนให้แยกข้อย่อย
    2. **Deterministic**: ผลลัพธ์ต้องชัดเจน ไม่กำกวม วัดผลได้ (e.g., "Error 401 displayed" ไม่ใช่ "System fails")
    3. **Independent**: แต่ละข้อต้องเป็นอิสระต่อกัน รันข้อไหนก่อนก็ได้
    4. **End-User Perspective**: เขียนในมุม User (User Story) ว่า User อยากทำอะไร ไม่ใช่เขียนตาม Code Function
    5. **Traceable**: ระบุได้ว่าเทสเพื่อจุดประสงค์อะไร

    COVERAGE STRATEGY: "The 3 Dimensions" (ต้องมีให้ครบ):
    1. **Positive Testing (Happy Path)**: ทางเดินปกติ User ใช้งานราบรื่น
    2. **Negative Testing (Sad Path)**: *สำคัญมาก* ทดสอบการจัดการ Error (e.g., Password ผิด, เน็ตหลุด, Input ผิด format) ระบบต้องไม่พังและแจ้งเตือนถูกต้อง
    3. **Boundary & Edge Cases**: ค่าสูงสุด/ต่ำสุด (Min/Max), ค่าว่าง (Null/Empty), ตัวอักษรพิเศษ, หรือ Input ที่เป็น Extreme case

    Output Format (JSON Object):
    {
      "reasoning": "Explain your testing strategy in Thai, explicitly mentioning how you covered the 3 Dimensions...",
      "tasks": [
        { 
          "id": "task_id", 
          "description": "[POSITIVE/NEGATIVE/EDGE] <Description adhering to Golden Rules> (In Thai)", 
          "expectedResult": "<Specific Deterministic Outcome> (In Thai)",
          "relatedFiles": ["src/App.tsx", "utils/helper.ts"] 
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_PRO,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    const json = JSON.parse(response.text || "{}");
    const tasks = (json.tasks || []).map((t: any) => ({ ...t, status: 'PENDING' }));
    const reasoning = json.reasoning || "Analyzing requirements...";
    return { tasks, reasoning };
  } catch (e) {
    console.error("Failed to parse task JSON", e);
    return { tasks: [], reasoning: "Error generating plan." };
  }
};

/**
 * 3. TESTER AGENT (Uses Smart Context & Data Mocking)
 * Update: Instructed to log specific INPUTS and OUTPUTS.
 */
export const executeTestSimulation = async (fullCode: string, task: Task, currentReport: string): Promise<{ passed: boolean; reason: string; executionLogs: string[] }> => {
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
    1. **MOCK DATA**: Define specific MOCK INPUTS (e.g., 'User enters <script>', 'API returns 500').
    2. **SIMULATE LOGIC**: Trace the code flow with these inputs step-by-step.
    3. **VALIDATE OUTPUT**: Compare the virtual output with the Expected Result.
    4. **LOGGING**: In 'executionLogs', explicitly state:
       - "INPUT: [Value]"
       - "ACTION: [Step]"
       - "OBSERVED OUTPUT: [Result]"

    Output JSON:
    { 
      "passed": boolean, 
      "reason": "Technical explanation in Thai",
      "executionLogs": [
         "INPUT: username = 'test', password = ''",
         "ACTION: Click Submit Button",
         "OBSERVED OUTPUT: Error message 'Required' appeared.",
         "Result: Validation logic works as expected."
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_FLASH,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || '{ "passed": false, "reason": "AI Error", "executionLogs": [] }');
  } catch (e) {
    return { passed: false, reason: "ไม่สามารถประมวลผลการทดสอบได้", executionLogs: ["Error parsing AI response"] };
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
