import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import './App.css';
import MiniHolmesApp from './MiniHolmesApp';

// 보호된 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// 리다이렉트 컴포넌트
const RedirectToAbout = () => {
  return <Navigate to="/miniholmes/about" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RedirectToAbout />} />
          <Route path="/miniholmes/*" element={<MiniHolmesApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// import TestThreeOnly from './components/TestThreeOnly';
// function App() {
//   return <TestThreeOnly />;
// }

// export default App;
