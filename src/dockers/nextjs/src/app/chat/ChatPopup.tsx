'use client';

import { FormEvent, useState } from 'react';

export function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    setChatHistory((messages) => [...messages, message]);
    setInput('');
  };

  return (
    // ยึดกล่องไว้ที่ขอบล่างสุด (bottom-0) และห่างจากขอบขวาเล็กน้อย (right-10)
    <div className="fixed bottom-0 right-10 z-50 w-[22rem] shadow-2xl max-sm:right-0 max-sm:w-full">
      <section
        id="global-chat-popup"
        aria-label="Global chat room"
        className="flex flex-col overflow-hidden rounded-t-xl border border-white/15 border-b-0 bg-slate-950 shadow-black/50"
      >
        {/* Header - ทำหน้าที่เป็นปุ่มกดเปิด/ปิดแชท */}
        <header
          onClick={() => setIsOpen(!isOpen)}
          className="flex cursor-pointer items-center justify-between bg-slate-900 px-4 py-3 transition hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            {/* จุดสีเขียวแสดงสถานะจำลอง */}
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <div>
              <h2 className="text-sm font-semibold text-white">Global chat</h2>
              <p className="text-[10px] text-slate-400">Offline mode</p>
            </div>
          </div>
          
          <button
            type="button"
            aria-label={isOpen ? 'Minimize chat' : 'Expand chat'}
            className="text-slate-400 hover:text-white"
          >
            {/* ไอคอนลูกศรชี้ขึ้น/ลง */}
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 15 12 9 18 15"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            )}
          </button>
        </header>

        {/* พื้นที่แชทและฟอร์ม (โชว์เฉพาะตอน isOpen เป็น true) */}
        {isOpen && (
          <div className="flex h-[24rem] flex-col border-t border-white/10 max-sm:h-[calc(100vh-10rem)]">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950 p-4">
              {chatHistory.length === 0 ? (
                <p className="pt-16 text-center text-sm text-slate-500">
                  No messages yet. Say hello.
                </p>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={`${message}-${index}`}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 text-sm text-white shadow-sm"
                  >
                    {message}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/10 bg-slate-900 p-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Write a message..."
                aria-label="Message"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}