
// ==========================================
// CONFIGURATION FILE
// ค่าตั้งต้นต่างๆ ของระบบ
// ==========================================

export const CONFIG = {
  STORAGE_KEY: 'QA_APP_STATE_V1', // Key สำหรับบันทึก State ลง LocalStorage
  
  // Model Configuration Strategy:
  // 1. PRO: ใช้สำหรับงานที่ต้องใช้ Logic สูง, การวางแผน, การวิเคราะห์ภาพรวม (Architect, QA Lead)
  GEMINI_MODEL_PRO: 'gemini-3-pro-preview', 
  
  // 2. FLASH: ใช้สำหรับงาน Routine, งานที่ทำซ้ำๆ, งานที่ Context ชัดเจนอยู่แล้ว (Tester, Fixer)
  GEMINI_MODEL_FLASH: 'gemini-3-flash-preview',
  
  MAX_CYCLES: 3, // จำนวนรอบสูงสุดที่จะให้ AI พยายามแก้บั๊ก (กัน Loop ไม่จบ)
  TOKEN_LIMIT: 1000000, // Limit token คร่าวๆ
  DEFAULT_SESSION_ID_PREFIX: 'qa_session_',
  
  // Cloudinary Config (สำหรับฝากไฟล์ Report/Logs)
  CLOUDINARY_CLOUD_NAME: 'damfrrvrb',
  CLOUDINARY_PRESET: 'qa-app',
};

export const INITIAL_REPORT_TEMPLATE = '# QA for Anyapp Progress Report\n----------------------------------\n';
