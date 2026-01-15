
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// NOTE: ในโปรเจคนี้เราใช้ Vite เป็น Build Tool ซึ่งรองรับการ import module แบบ ES6 (import ... from '...') 
// ได้โดยตรงผ่าน node_modules ครับ จึงไม่จำเป็นต้องใช้ <script type="importmap"> ใน index.html 
// เหมือนกับการเขียน HTML/JS แบบดั้งเดิมที่ไม่มี Build step ครับ

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
