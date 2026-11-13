// 화면이 넘어가는 동안 보여주는 픽셀 로딩 화면
//  - message: 큰 안내 문구 (예: "거실로 들어가는 중")
//  - 서버 컴포넌트(loading.js)에서도 쓸 수 있게 훅(useState 등)을 쓰지 않았어요
export default function LoadingScreen({
  message = '은아네 집으로 들어가는 중',
  sub = '맛있는 음식을 준비하고 있어요 🔥',
}) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 text-center">
      <style>{`
        @keyframes load-hop { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes load-dot { 0%,100% { opacity: .2 } 50% { opacity: 1 } }
        @keyframes load-bar { from { transform: translateX(-100%) } to { transform: translateX(250%) } }
        .load-hop { animation: load-hop .6s steps(3, jump-none) infinite; }
        .load-dot { animation: load-dot 1.2s steps(2, jump-none) infinite; }
        .load-bar { animation: load-bar 1.1s steps(8, end) infinite; }
      `}</style>

      {/* 통통 튀는 문 */}
      <span className="load-hop text-6xl drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]">
        🚪
      </span>

      <div>
        <p className="text-2xl font-black text-amber-100">
          {message}
          <span className="load-dot">.</span>
          <span className="load-dot" style={{ animationDelay: '0.2s' }}>
            .
          </span>
          <span className="load-dot" style={{ animationDelay: '0.4s' }}>
            .
          </span>
        </p>
        <p className="mt-2 text-sm text-amber-100/70">{sub}</p>
      </div>

      {/* 도트 로딩 막대 */}
      <div className="h-5 w-64 overflow-hidden border-4 border-[#f5e6c8] bg-[#2b1d1a] p-0.5">
        <div className="load-bar h-full w-2/5 bg-amber-400" />
      </div>
    </div>
  );
}
