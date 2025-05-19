import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
// import Counter from "./pages/Counter";
import RoomSizeInput from "./pages/RoomSizeInput";
import StyleSelect from "./pages/StyleSelect";
import FurnitureSelect from "./pages/FurnitureSelect";
import OptionSelect from "./pages/OptionSelect";
import Input2 from "./pages/Input2";
// import List from "./pages/List";

function App() {
  return (
    <div className="App min-h-screen font-sans bg-white text-black">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tight">
              <Link to="/" className="text-black no-underline hover:opacity-80">
                미니홈즈 MiniHolmes
              </Link>
            </h1>
            <p className="text-sm text-gray-600">
              원룸 자취생을 위한 최적의 가구 배치 솔루션
            </p>
          </div>

          {/* 메뉴 */}
          <nav>
            <ul className="flex gap-6 text-lg font-semibold list-none m-0 p-0">
              {/* <li>
                <Link to="/" className="hover:underline">Home</Link>
              </li> */}
              <li>
                <Link to="/about" className="hover:underline">MiniHolmes에 대하여</Link>
              </li>
              <li>
                <Link to="/input" className="hover:underline">서비스 경험해보기</Link>
              </li>
              <li>
                <Link to="/input2" className="hover:underline">임시 메뉴</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* 라우팅 영역 */}
      <main className="px-6 py-6">
        <Routes>
          {/* <Route path="/" element={<Home />} /> */}
          <Route path="/about" element={<About />} />
          {/* <Route path="/counter" element={<Counter />} /> */}
          <Route path="/input" element={<RoomSizeInput />} />
          <Route path="/style" element={<StyleSelect />} />
          <Route path="/furnitureselect" element={<FurnitureSelect />} />
          <Route path="/optionselect" element={<OptionSelect />} />
          <Route path="/input2" element={<Input2 />} />
          {/* <Route path="/list" element={<List />} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
