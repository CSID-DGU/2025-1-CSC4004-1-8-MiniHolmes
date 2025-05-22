import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import Step1 from "./pages/Step1";
import About from "./pages/About";
import RoomSizeInput from "./pages/RoomSizeInput";
// import DoorWindowSizeInput from "./pages/DoorWindowSizeInput";
import DoorSizeInput from "./pages/DoorSizeInput";
import WindowSizeInput from "./pages/WindowSizeInput";
import ToiletInput from "./pages/ToiletInput";
import BuiltinInput from "./pages/BuiltinInput";
import Step2 from "./pages/Step2";
import FurnitureSelect from "./pages/FurnitureSelect";
import ImportanceOrder from "./pages/ImportanceOrder";
import ColortoneSelect from "./pages/StyleSelect";
import StyleSelect from "./pages/ColortoneSelect";
import PointcolorSelect from "./pages/PointcolorSelect";
import Step3 from "./pages/Step3";
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
                <li><Link to="/step1" className="menuLink">서비스 경험해보기</Link></li>
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
            <Route path="/step1" element={<Step1 />} />
            <Route path="/about" element={<About />} />
            <Route path="/room" element={<RoomSizeInput />} />
            {/* <Route path="/doorWindow" element={<DoorWindowSizeInput />} /> */}
            <Route path="/door" element={<DoorSizeInput />} />
            <Route path="/window" element={<WindowSizeInput />} />
            <Route path="/toilet" element={<ToiletInput />} />
            <Route path="/builtin" element={<BuiltinInput />} />
            <Route path="/step2" element={<Step2 />} />
            <Route path="/furniture" element={<FurnitureSelect />} />
            <Route path="/order" element={<ImportanceOrder />} />
            <Route path="/colortone" element={<ColortoneSelect />} />
            <Route path="/style" element={<StyleSelect />} />
            <Route path="/pointcolor" element={<PointcolorSelect />} />
            <Route path="/step3" element={<Step3 />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
