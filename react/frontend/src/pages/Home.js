import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const Home = () => {
    useEffect(() => {
        document.title = "원룸 자취생을 위한 가구 배치 솔루션, 미니홈즈";
    }, []);

    return (
        <div className="min-h-screen font-sans bg-white text-black">
            {/* 본문 */}
            {/* <main className="px-6 py-12 max-w-4xl mx-auto">
                <h3 className="text-3xl font-bold mb-4">원룸 자취생을 위한 최적의 가구 배치 솔루션</h3>
                <p className="text-lg text-gray-700"></p>
            </main> */}
        </div>
    );
};


export default Home;
