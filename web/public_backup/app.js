document.addEventListener('DOMContentLoaded', () => {
    initCyberMatrixCanvas();
    initScrollProgress();
    initCyberCursor();
    initPongCanvasGame();
    initTelemetryCounters();
    initMockChatSystem();
    initAccordion();
    initProxyInspector();
    initMobileNav();
});

// 1. Matrix Cyber Grid Canvas Background
function initCyberMatrixCanvas() {
    const canvas = document.getElementById('cyber-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const columns = Math.floor(width / 20);
    const drops = Array(columns).fill(1);
    const chars = '0142TRANSCENDENCE_CYBER_PONG_NET_WSS_SSL_';

    function renderMatrix() {
        ctx.fillStyle = 'rgba(5, 7, 11, 0.15)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00f3ff';
        ctx.font = '12px "JetBrains Mono"';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            const x = i * 20;
            const y = drops[i] * 20;

            ctx.fillText(text, x, y);

            if (y > height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
        requestAnimationFrame(renderMatrix);
    }
    renderMatrix();
}

// 2. Scroll Progress & Active Nav Indicator
function initScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-item');

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        if (progressBar) progressBar.style.width = `${scrollPercent}%`;

        let currentSec = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            const height = sec.offsetHeight;
            if (scrollTop >= top && scrollTop < top + height) {
                currentSec = sec.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${currentSec}`) {
                item.classList.add('active');
            }
        });
    });
}

// 3. Cyber Neon Cursor Tracking
function initCyberCursor() {
    const cursor = document.getElementById('cyber-cursor');
    if (!cursor) return;

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
    });
}

// 4. Interactive Pong Game Engine (Playable or AI Mode)
function initPongCanvasGame() {
    const canvas = document.getElementById('pong-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const scoreP1 = document.getElementById('score-p1');
    const scoreP2 = document.getElementById('score-p2');
    const btnStart = document.getElementById('btn-start-pong');
    const btnToggleAi = document.getElementById('btn-toggle-ai');

    const state = {
        ballX: 400,
        ballY: 200,
        ballSpeedX: 5,
        ballSpeedY: 3,
        p1Y: 160,
        p2Y: 160,
        paddleHeight: 80,
        paddleWidth: 12,
        p1Score: 0,
        p2Score: 0,
        isAiVsAi: true,
        gameRunning: true
    };

    // Keyboard & Mouse Listeners
    window.addEventListener('mousemove', (e) => {
        if (!state.isAiVsAi) {
            const rect = canvas.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            state.p1Y = Math.max(0, Math.min(canvas.height - state.paddleHeight, mouseY - state.paddleHeight / 2));
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!state.isAiVsAi) {
            if (e.key === 'w' || e.key === 'W') state.p1Y = Math.max(0, state.p1Y - 15);
            if (e.key === 's' || e.key === 'S') state.p1Y = Math.min(canvas.height - state.paddleHeight, state.p1Y + 15);
        }
    });

    function update() {
        if (!state.gameRunning) return;

        // Move Ball
        state.ballX += state.ballSpeedX;
        state.ballY += state.ballSpeedY;

        // Top/Bottom Wall Bounce
        if (state.ballY <= 10 || state.ballY >= canvas.height - 10) {
            state.ballSpeedY *= -1;
        }

        // P1 AI logic if AI vs AI enabled
        if (state.isAiVsAi) {
            const p1Center = state.p1Y + state.paddleHeight / 2;
            if (p1Center < state.ballY - 10) state.p1Y += 4;
            else if (p1Center > state.ballY + 10) state.p1Y -= 4;
        }

        // P2 AI Logic (Always active for opponent)
        const p2Center = state.p2Y + state.paddleHeight / 2;
        if (p2Center < state.ballY - 12) state.p2Y += 4.5;
        else if (p2Center > state.ballY + 12) state.p2Y -= 4.5;

        // P1 Paddle Collision
        if (state.ballX <= 25 && state.ballY >= state.p1Y && state.ballY <= state.p1Y + state.paddleHeight) {
            state.ballSpeedX = Math.abs(state.ballSpeedX) * 1.04;
            state.ballSpeedY += (state.ballY - (state.p1Y + state.paddleHeight / 2)) * 0.1;
        }

        // P2 Paddle Collision
        if (state.ballX >= canvas.width - 25 && state.ballY >= state.p2Y && state.ballY <= state.p2Y + state.paddleHeight) {
            state.ballSpeedX = -Math.abs(state.ballSpeedX) * 1.04;
            state.ballSpeedY += (state.ballY - (state.p2Y + state.paddleHeight / 2)) * 0.1;
        }

        // Goal Check
        if (state.ballX < 0) {
            state.p2Score++;
            resetBall(1);
        } else if (state.ballX > canvas.width) {
            state.p1Score++;
            resetBall(-1);
        }

        if (scoreP1) scoreP1.textContent = state.p1Score;
        if (scoreP2) scoreP2.textContent = state.p2Score;
    }

    function resetBall(direction) {
        state.ballX = canvas.width / 2;
        state.ballY = canvas.height / 2;
        state.ballSpeedX = 5 * direction;
        state.ballSpeedY = (Math.random() - 0.5) * 6;
    }

    function draw() {
        // Clear Canvas
        ctx.fillStyle = '#030509';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center Dotted Net Line
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Left Paddle (Cyan)
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(15, state.p1Y, state.paddleWidth, state.paddleHeight);

        // Draw Right Paddle (Magenta)
        ctx.fillStyle = '#ff0077';
        ctx.shadowColor = '#ff0077';
        ctx.shadowBlur = 10;
        ctx.fillRect(canvas.width - 27, state.p2Y, state.paddleWidth, state.paddleHeight);

        // Draw Ball (White Glow)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(state.ballX, state.ballY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            state.isAiVsAi = false;
            state.p1Score = 0;
            state.p2Score = 0;
            showToastHUD('Player Control Activated! Move mouse to control Left Paddle.');
        });
    }

    if (btnToggleAi) {
        btnToggleAi.addEventListener('click', () => {
            state.isAiVsAi = !state.isAiVsAi;
            showToastHUD(`Mode Toggled: ${state.isAiVsAi ? 'AI vs AI Simulation' : 'Manual Player Control'}`);
        });
    }
}

// 5. Telemetry Number Counter
function initTelemetryCounters() {
    const counters = document.querySelectorAll('.tel-num');
    let animated = false;

    window.addEventListener('scroll', () => {
        if (animated) return;
        const grid = document.querySelector('.telemetry-grid');
        if (!grid) return;

        const rect = grid.getBoundingClientRect();
        if (rect.top <= window.innerHeight) {
            animated = true;
            counters.forEach(c => {
                const target = parseFloat(c.getAttribute('data-target'));
                const duration = 1400;
                const startTime = performance.now();

                function update(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    c.textContent = Math.floor(progress * target);
                    if (progress < 1) requestAnimationFrame(update);
                    else c.textContent = target;
                }
                requestAnimationFrame(update);
            });
        }
    });
}

// 6. Interactive Mock Chat Box
function initMockChatSystem() {
    const chatInput = document.getElementById('chat-input-field');
    const btnSend = document.getElementById('btn-send-chat');
    const messagesBox = document.getElementById('chat-messages-box');

    function sendMessage() {
        if (!chatInput || !messagesBox) return;
        const text = chatInput.value.trim();
        if (!text) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        msgDiv.innerHTML = `<span class="msg-author neon-cyan">you:</span> ${escapeHtml(text)}`;
        messagesBox.appendChild(msgDiv);

        chatInput.value = '';
        messagesBox.scrollTop = messagesBox.scrollHeight;

        // Auto Bot Reply Simulation
        setTimeout(() => {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'msg';
            replyDiv.innerHTML = `<span class="msg-author neon-magenta">bot_42:</span> Acknowledgement [RXT]: "${escapeHtml(text)}" broadcast via WebSockets!`;
            messagesBox.appendChild(replyDiv);
            messagesBox.scrollTop = messagesBox.scrollHeight;
        }, 1000);
    }

    if (btnSend) btnSend.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

// 7. Accordion Expander
function initAccordion() {
    const accItems = document.querySelectorAll('.acc-item');
    accItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('open');
        });
    });
}

// 8. Nginx Proxy Telemetry Inspector
function initProxyInspector() {
    const btnRefresh = document.getElementById('btn-refresh-proxy');
    const btnPing = document.getElementById('btn-ping-proxy');
    const btnCopy = document.getElementById('btn-copy-proxy');
    const proxySearch = document.getElementById('proxy-search');

    const valProto = document.getElementById('val-proto');
    const valIp = document.getElementById('val-ip');
    const valSsl = document.getElementById('val-ssl');
    const valLatency = document.getElementById('val-latency');
    const proxyBody = document.getElementById('proxy-headers-body');

    let currentData = null;

    async function fetchProxyHeaders() {
        const start = performance.now();
        if (proxyBody) proxyBody.innerHTML = `<tr><td colspan="3" class="loading-cell">Querying Nginx proxy telemetry...</td></tr>`;

        try {
            const res = await fetch('/api/proxy-info');
            const end = performance.now();
            const latency = Math.round(end - start);

            const data = await res.json();
            currentData = data;

            if (valProto) valProto.textContent = (data.protocol || 'HTTPS').toUpperCase();
            if (valIp) valIp.textContent = data.realIp || data.clientIp || '127.0.0.1';
            if (valSsl) valSsl.textContent = `${data.sslProtocol} (${data.sslCipher || 'Ed25519'})`;
            if (valLatency) valLatency.textContent = `${latency} ms`;

            renderTable(data.headers, proxySearch ? proxySearch.value : '');
        } catch (err) {
            if (proxyBody) proxyBody.innerHTML = `<tr><td colspan="3" class="loading-cell" style="color: #ff0077;">Error reaching Nginx backend: ${err.message}</td></tr>`;
        }
    }

    function renderTable(headersObj, filterText = '') {
        if (!proxyBody || !headersObj) return;
        proxyBody.innerHTML = '';

        const entries = Object.entries(headersObj).filter(([k, v]) => {
            const search = filterText.toLowerCase();
            return k.toLowerCase().includes(search) || String(v).toLowerCase().includes(search);
        });

        if (entries.length === 0) {
            proxyBody.innerHTML = `<tr><td colspan="3" class="loading-cell">No matching headers found.</td></tr>`;
            return;
        }

        entries.forEach(([key, val]) => {
            const isProxied = key.startsWith('x-') || key === 'host';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(key)}</td>
                <td>${escapeHtml(String(val))}</td>
                <td>
                    <span class="hud-pill" style="${isProxied ? 'border-color: var(--neon-cyan); color: var(--neon-cyan);' : 'border-color: rgba(255,255,255,0.1); color: var(--text-dim);'}">
                        ${isProxied ? 'PROXIED HEADER' : 'STANDARD'}
                    </span>
                </td>
            `;
            proxyBody.appendChild(tr);
        });
    }

    if (btnRefresh) btnRefresh.addEventListener('click', fetchProxyHeaders);
    if (btnPing) btnPing.addEventListener('click', fetchProxyHeaders);
    if (proxySearch) {
        proxySearch.addEventListener('input', (e) => {
            if (currentData && currentData.headers) {
                renderTable(currentData.headers, e.target.value);
            }
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            if (currentData) {
                navigator.clipboard.writeText(JSON.stringify(currentData, null, 2)).then(() => {
                    showToastHUD('Telemetry JSON copied to clipboard!');
                });
            }
        });
    }

    fetchProxyHeaders();
}

// 9. Mobile Nav Toggle
function initMobileNav() {
    const hamburger = document.getElementById('hamburger-btn');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navMenu.classList.remove('open'));
        });
    }
}

// Helper: Escape HTML & Toast
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function showToastHUD(msg) {
    const toast = document.getElementById('toast-hud');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3500);
}
