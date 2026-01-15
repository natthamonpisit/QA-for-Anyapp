
import { GoogleGenAI } from "@google/genai";
import { AgentRole, Task } from "../types";
import { CONFIG } from "../config";

// ==========================================
// GEMINI SERVICE
// หัวใจหลักในการคุยกับ AI (Google Gemini)
// แบ่งหน้าที่ตาม Role ของ Agent เพื่อเลือก Model ที่เหมาะสม
// ==========================================

// Helper: ตรวจสอบและสร้าง Instance ของ Gemini Client
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  // Initialize client ด้วย API Key จาก Environment Variable
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * 1. ARCHITECT AGENT (สถาปนิกซอฟต์แวร์)
 * หน้าที่: อ่านโค้ดทั้งหมด แล้วสรุปโครงสร้าง (Structure) และ Logic สำคัญ
 * Model: GEMINI PRO (ต้องการความฉลาดสูงสุดในการทำความเข้าใจบริบทใหญ่)
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

  // เรียกใช้ Model PRO
  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_PRO,
    contents: prompt,
  });

  return response.text || "ไม่สามารถวิเคราะห์โค้ดได้";
};

/**
 * 2. QA LEAD AGENT (หัวหน้าทีม QA)
 * หน้าที่: วางแผนการทดสอบ (Test Plan) โดยดูจากสรุปโครงสร้างและ Report ล่าสุด
 * Model: GEMINI PRO (ต้องการ Logic ในการแตกงานที่ซับซ้อน และครอบคลุม)
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

  // เรียกใช้ Model PRO และบังคับ Output เป็น JSON
  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_PRO,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  try {
    const tasks = JSON.parse(response.text || "[]");
    // เติม status เริ่มต้นเป็น PENDING
    return tasks.map((t: any) => ({ ...t, status: 'PENDING' }));
  } catch (e) {
    console.error("Failed to parse task JSON", e);
    return [];
  }
};

/**
 * 3. TESTER AGENT (ผู้ทดสอบ)
 * หน้าที่: จำลองการทำงาน (Simulation) ของโค้ดตาม Task ที่ได้รับ
 * Model: GEMINI FLASH (เน้นความเร็ว เพราะปริมาณ Task เยอะ และ Scope งานแคบลงแล้ว)
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

  // เรียกใช้ Model FLASH
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
 * 4. FIXER AGENT (นักพัฒนา)
 * หน้าที่: เขียนโค้ดแก้บั๊กตามผลการทดสอบที่ Failed
 * Model: GEMINI FLASH (เน้นความเร็วในการเจนโค้ดสั้นๆ ตามคำสั่งที่ชัดเจน)
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

  // เรียกใช้ Model FLASH
  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL_FLASH,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return response.text || "// ไม่สามารถสร้าง Code แก้ไขได้";
};
