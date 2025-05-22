import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/Navbar';
import './App.css';
import RoomVisualizer from './components/RoomVisualizer';


// 보호된 라우트를 위한 컴포넌트
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoomVisualizer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
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