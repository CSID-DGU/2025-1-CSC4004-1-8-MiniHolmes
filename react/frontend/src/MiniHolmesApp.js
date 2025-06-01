import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import RegisterSimple from "./components/auth/RegisterSimple";

import Home from "./pages/Home";
import About from "./pages/About";
import RoomSizeInput from "./pages/RoomSizeInput";
import DoorSizeInput from "./pages/DoorSizeInput";
import WindowSizeInput from "./pages/WindowSizeInput";
import StyleSelect from "./pages/StyleSelect";
import FurnitureSelect from "./pages/FurnitureSelect";
import ImportanceOrder from "./pages/ImportanceOrder";
import Community from "./pages/Community";
import RoomVisualizer from "./components/RoomVisualizer";
import PartitionZoneInput from './pages/PartitionZoneInput';
import PartitionDoorInput from './pages/PartitionDoorInput';
import Step1 from "./pages/Step1";
import Step2 from "./pages/Step2";
import BudgetSelect from "./pages/BudgetSelect";
import ColortoneSelect from "./pages/ColortoneSelect";
import PointcolorSelect from "./pages/PointcolorSelect";
import Step3 from "./pages/Step3";

import logo from "./assets/logo.png";
import "./pages/style/TopMenu.css";
import "./pages/style/LoginBottomSheet.css";
import "./pages/style/RegisterCenter.css";
import "./pages/style/RegisterSimpleSheet.css";

function MiniHolmesApp() {
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [showRegister, setShowRegister] = useState(false); // 회원가입 폼 표시 여부
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
    if (location.pathname !== "/miniholmes/mypage") {
      setLoggingOut(false);
      setShowRegister(false); // 다른 페이지로 이동시 회원가입 폼 숨김
    }
  }, [location]);

  useEffect(() => {
    if (location.pathname === "/miniholmes/mypage" && !user && !loggingOut) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [location, user, loggingOut]);

  const handleMypageClick = (e) => {
    e.preventDefault();
    navigate("/miniholmes/mypage");
  };

  const handleLoginSuccess = () => {
    setShowRegister(false);
    window.location.reload();
  };

  const handleLogout = () => {
    setLoggingOut(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/miniholmes");
  };

  const handleServiceStart = (e) => {
    e.preventDefault();
    localStorage.removeItem('roomSize');
    localStorage.removeItem('placement');
    navigate('/miniholmes/step1');
  };

  const handleShowRegister = () => {
    setShowRegister(true);
  };

  const handleShowLogin = () => {
    setShowRegister(false);
  };

  return (
    <div className="w-full">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          {/* 로고 */}
          <div className="flex items-center space-x-4" style={{ paddingLeft: "20px" }}>
            <Link to="/miniholmes">
              <img src={logo} alt="MiniHolmes 로고" style={{ height: "70px", marginTop: "20px", marginBottom: "20px" }} />
            </Link>
          </div>

          {/* 메뉴 */}
          <div id="topMenuWrapper">
            <nav id="topMenu">
              <ul>
                <li><Link to="/miniholmes/about" className="menuLink">미니홈즈 소개</Link></li>
                <li><a href="#" onClick={handleServiceStart} className="menuLink">서비스 경험해보기</a></li>
                <li><Link to="/miniholmes/community" className="menuLink">커뮤니티</Link></li>
                <li><a href="#" onClick={handleMypageClick} className="menuLink">마이페이지</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <div className="bg-[#f5f5f5] min-h-screen">
        <main className="px-6 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="input" element={<RoomSizeInput />} />
            <Route path="input/door" element={<DoorSizeInput />} />
            <Route path="input/window" element={<WindowSizeInput />} />
            <Route path="input/partition" element={<PartitionZoneInput />} />
            <Route path="input/style" element={<StyleSelect />} />
            <Route path="input/furniture" element={<FurnitureSelect />} />
            <Route path="input/order" element={<ImportanceOrder />} />
            <Route path="visualizer" element={<RoomVisualizer />} />
            <Route path="community" element={<Community />} />
            <Route path="step1" element={<Step1 />} />
            <Route path="step2" element={<Step2 />} />
            <Route path="budget" element={<BudgetSelect />} />
            <Route path="furniture" element={<FurnitureSelect />} />
            <Route path="style" element={<StyleSelect />} />
            <Route path="colortone" element={<ColortoneSelect />} />
            <Route path="pointcolor" element={<PointcolorSelect />} />
            <Route path="order" element={<ImportanceOrder />} />
            <Route path="step3" element={<Step3 />} />
            <Route path="mypage" element={
              user ? (
                <div style={{ textAlign: "center", marginTop: "40px" }}>
                  <div style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
                    안녕하세요, <b>{user.userId || user.name || user.email}</b>님!
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "#6c63ff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 20px",
                      cursor: "pointer"
                    }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : null
            } />
            <Route path="input/*" element={<Navigate to="/miniholmes/input" replace />} />
            <Route path="input/partition-door" element={<PartitionDoorInputWrapper />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>

      {/* 로그인/회원가입 모달: /miniholmes/mypage 경로에서만 표시 */}
      {location.pathname === "/miniholmes/mypage" && !user && !loggingOut && (
        <div className={showRegister ? "" : "login-bottom-sheet"}>
          <div className="login-form-container">
            {showRegister ? (
              <RegisterSimple onShowLogin={handleShowLogin} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} onShowRegister={handleShowRegister} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PartitionDoorInputWrapper() {
  const location = useLocation();
  const partitionZones = location.state?.partitionZones || [];
  return <PartitionDoorInput partitionZones={partitionZones} />;
}

export default MiniHolmesApp;
