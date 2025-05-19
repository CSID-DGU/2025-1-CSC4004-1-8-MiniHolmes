import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import RoomSizeInput from "./pages/RoomSizeInput";
import DoorSizeInput from "./pages/DoorSizeInput";
import WindowSizeInput from "./pages/WindowSizeInput";
import StyleSelect from "./pages/StyleSelect";
import FurnitureSelect from "./pages/FurnitureSelect";
import ImportanceOrder from "./pages/ImportanceOrder";
import Community from "./pages/Community";

import logo from "./assets/logo.png";
import "./pages/style/TopMenu.css";

function App() {
  return (
    <div className="w-full">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          {/* 로고 */}
          <div className="flex items-center space-x-4" style={{ paddingLeft: "20px" }}>
            <Link to="/">
              <img src={logo} alt="MiniHolmes 로고" style={{ height: "70px", marginTop: "20px", marginBottom: "20px" }} />
            </Link>
          </div>

          {/* 메뉴 */}
          <div id="topMenuWrapper">
            <nav id="topMenu">
              <ul>
                <li><Link to="/about" className="menuLink">미니홈즈 소개</Link></li>
                <li><Link to="/input" className="menuLink">서비스 경험해보기</Link></li>
                <li><Link to="/community" className="menuLink">커뮤니티</Link></li>
                <li><Link to="/mypage" className="menuLink">마이페이지</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <div className="bg-[#f5f5f5] min-h-screen">
        <main className="px-6 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/input" element={<RoomSizeInput />} />
            <Route path="/door" element={<DoorSizeInput />} />
            <Route path="/window" element={<WindowSizeInput />} />
            <Route path="/style" element={<StyleSelect />} />
            <Route path="/furniture" element={<FurnitureSelect />} />
            <Route path="/order" element={<ImportanceOrder />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
