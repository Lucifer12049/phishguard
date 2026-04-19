/**
 * ==============================================================================
 * PHISHGUARD CORE ENGINE
 * Developer: Anand Kumar
 * Description: Client-side AI threat analysis using Google's Gemini API.
 * ==============================================================================
 */

class PhishGuardApp {
    constructor() {
        console.log("🚀 [PhishGuard] Initializing Engine...");
        
        this.GEMINI_API_KEY = 'AIzaSyBEsSsiMH0vxdMQUYbTNwQtA6obPfncEWM'; 
        this.GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;

        this.currentTab = 'url';
        this.isScanning = false;
        this.scanHistory = JSON.parse(localStorage.getItem('phishguard_history') || '[]');

        this.tabsData = {
            url: {
                label: 'Paste a URL or link to analyze',
                placeholder: 'https://suspicious-bank-login.ru/verify?token=abc123',
                examples: ['http://paypa1-secure-login.ru/account/verify', 'https://google.com', 'http://bit.ly/3xWin-prize-claim-now', 'https://amazon.com/dp/B08N5WRWNW']
            },
            message: {
                label: 'Paste a suspicious message or SMS',
                placeholder: "Congratulations! You've been selected to win Rs 50,000. Click here to claim...",
                examples: ['Urgent: Your SBI account has been locked. Verify at http://sbi-secure.ru/login now!', 'Hey, are we still meeting for lunch tomorrow at 1pm?', 'You have won iPhone 15! Claim at http://free-prize.in within 24 hours or lose it!']
            },
            email: {
                label: 'Paste email content, subject, or sender details',
                placeholder: 'From: security@paypa1.com\nSubject: URGENT: Account suspended\n\nDear Customer...',
                examples: ['From: noreply@hdfc-bank-alert.xyz — Your account is suspended. Verify now.', 'From: irs-gov-refund@gmail.com — You have a $2,400 tax refund pending.', 'Hi Team, please find the Q3 sales report attached.']
            },
            apk: {
                label: 'Enter the APK package name to check',
                placeholder: 'com.suspicious.freegems.generator',
                examples: ['com.whatsapp.update.pro.free.unlimited', 'com.google.android.youtube', 'com.free.gems.generator.clash.royale', 'in.paytm.app']
            }
        };

        this.loadingMessages = [
            'Parsing input structure...', 'Checking domain heuristics...', 'Analyzing payload linguistics...', 
            'Cross-referencing threat vectors...', 'Evaluating social engineering patterns...', 'Compiling threat matrix...'
        ];
    }

    init() {
        console.log("⚙️ [PhishGuard] Caching DOM Elements...");
        // Fetch DOM elements safely
        this.dom = {
            inputEl: document.getElementById('main-input'),
            inputLabel: document.getElementById('input-label'),
            charCounter: document.getElementById('char-counter'),
            clearBtn: document.getElementById('clear-btn'),
            scanBtn: document.getElementById('scan-btn'),
            btnText: document.getElementById('btn-text'),
            resultArea: document.getElementById('result-area'),
            exChips: document.getElementById('ex-chips'),
            histSection: document.getElementById('history-section'),
            histList: document.getElementById('history-list'),
            clearHistBtn: document.getElementById('clear-history-btn'),
            tabContainer: document.querySelector('.tabs-row'),
            tabBtns: document.querySelectorAll('.tab-btn'),
            navLinks: document.querySelectorAll('.nav-link')
        };

        if (!this.dom.tabContainer) {
            console.error("❌ [PhishGuard] CRITICAL ERROR: Could not find .tabs-row in HTML!");
            return; 
        }

        this.bindEvents();
        this.renderExamples('url');
        this.renderHistory();
        this.animateStats();
        this.updateNavActiveState();
        this.checkApiKeySetup();
        
        console.log("✅ [PhishGuard] Engine Ready.");
    }

    bindEvents() {
        console.log("🔗 [PhishGuard] Binding Event Listeners...");

        this.dom.tabContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-btn');
            if (!button) return; 

            const targetTab = button.getAttribute('data-tab');
            if (targetTab) {
                this.switchTab(targetTab);
            }
        });

        this.dom.inputEl.addEventListener('input', () => this.handleInput());
        this.dom.clearBtn.addEventListener('click', () => this.clearInput());
        this.dom.inputEl.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') this.runScan();
        });

        this.dom.scanBtn.addEventListener('click', () => this.runScan());
        
        if (this.dom.clearHistBtn) {
            this.dom.clearHistBtn.addEventListener('click', () => this.clearHistory());
        }

        window.addEventListener('scroll', () => this.updateNavActiveState());
    }

    checkApiKeySetup() {
        if (this.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            this.dom.resultArea.innerHTML = `
                <div style="margin-top:1.25rem;padding:1.25rem 1.5rem;background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.25);border-radius:12px;font-family:var(--font-mono);font-size:13px;">
                    <div style="color:var(--amber);font-weight:700;margin-bottom:10px;">[!] System Configuration Required</div>
                    <div style="color:var(--text-secondary);line-height:1.9;">
                        The analysis engine requires a Gemini API key to function.<br/>
                        1. Obtain a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent);text-decoration:none;">aistudio.google.com</a><br/>
                        2. Update the <code style="color:var(--accent);">GEMINI_API_KEY</code> variable in <code style="color:var(--text-primary);">app.js</code><br/>
                        3. Reload the application instance.
                    </div>
                </div>`;
        }
    }

    switchTab(tabId) {
        if (tabId === this.currentTab) return;

        this.currentTab = tabId;

        this.dom.tabBtns.forEach(b => {
            if (b.getAttribute('data-tab') === tabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        
        const data = this.tabsData[tabId];
        if (!data) return;

        this.dom.inputLabel.textContent = data.label;
        this.dom.inputEl.placeholder = data.placeholder;
        this.clearInput();
        this.dom.resultArea.innerHTML = '';
        this.renderExamples(tabId);
    }

    handleInput() {
        const len = this.dom.inputEl.value.length;
        this.dom.charCounter.textContent = `${len} byte${len !== 1 ? 's' : ''}`;
        this.dom.clearBtn.classList.toggle('visible', len > 0);
    }

    clearInput() {
        this.dom.inputEl.value = '';
        this.dom.charCounter.textContent = '0 bytes';
        this.dom.clearBtn.classList.remove('visible');
        this.dom.inputEl.focus();
    }

    renderExamples(tabId) {
        this.dom.exChips.innerHTML = '';
        this.tabsData[tabId].examples.forEach(ex => {
            const chip = document.createElement('button');
            chip.className = 'ex-chip';
            chip.textContent = ex.length > 45 ? ex.slice(0, 45) + '…' : ex;
            chip.title = ex;
            chip.addEventListener('click', () => {
                this.dom.inputEl.value = ex;
                this.handleInput();
                this.dom.inputEl.focus();
            });
            this.dom.exChips.appendChild(chip);
        });
    }

    async runScan() {
        const input = this.dom.inputEl.value.trim();
        if (!input || this.isScanning) return;

        if (this.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            this.showError('ERR_MISSING_API_KEY: Update configuration in app.js.');
            return;
        }

        this.setLoadingState(true);
        const typeLabels = { url: 'URL / Web Link', message: 'SMS / Text Message', email: 'Electronic Mail', apk: 'Android Package (APK)' };
        const prompt = this.buildPrompt(input, typeLabels[this.currentTab]);

        try {
            console.log("📡 [PhishGuard] Sending payload to Gemini API...");
            
            // Using Gemini's native Structured Output (Schema) to guarantee perfect JSON
            const response = await fetch(this.GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { 
                        temperature: 0.1, 
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: {
                                verdict: { type: "STRING" },
                                risk_score: { type: "INTEGER" },
                                summary: { type: "STRING" },
                                flags: {
                                    type: "ARRAY",
                                    items: {
                                        type: "OBJECT",
                                        properties: {
                                            level: { type: "STRING" },
                                            text: { type: "STRING" }
                                        }
                                    }
                                },
                                recommendation: { type: "STRING" }
                            },
                            required: ["verdict", "risk_score", "summary", "flags", "recommendation"]
                        }
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `HTTP_STATUS_${response.status}`);
            }

            const data = await response.json();
            
            // Check if the API completely blocked the response (safety filters)
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('ERR_BLOCKED: The API returned no data. This is usually due to safety filters blocking the content.');
            }

            const rawText = data.candidates[0]?.content?.parts?.[0]?.text || '';
            
            if (!rawText) throw new Error('ERR_EMPTY_RESPONSE: Analysis engine returned an empty string.');

            console.log("📥 [PhishGuard] Response received! Raw output:", rawText);
            
            let result;
            try {
                // Because we used responseSchema, we no longer need regex cleaners!
                result = JSON.parse(rawText);
            } catch (parseError) {
                console.error("🚨 JSON Parse Failed! The AI returned:", rawText);
                throw new SyntaxError("Heuristic engine returned unparsable format. Please try scanning again.");
            }
            
            this.showResult(result, input);
            this.addToHistory(input, result);

        } catch (err) {
            console.error('[PhishGuard Engine Error]', err);
            if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid')) {
                this.showError('ERR_AUTH: Invalid API key credentials.');
            } else if (err.message.includes('RESOURCE_EXHAUSTED')) {
                this.showError('ERR_QUOTA: Rate limit exceeded. Engine will reset at 00:00 UTC.');
            } else if (err instanceof SyntaxError) {
                this.showError(err.message);
            } else {
                this.showError(`SYS_ERR: ${err.message}`);
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        this.isScanning = isLoading;
        this.dom.scanBtn.disabled = isLoading;
        this.dom.btnText.textContent = isLoading ? 'Executing...' : 'Execute Scan';

        if (isLoading) {
            let msgIdx = 0;
            this.dom.resultArea.innerHTML = `
                <div class="loading-state" id="loading-state">
                    <div class="loading-radar">
                        <div class="radar-ring"></div><div class="radar-ring"></div><div class="radar-ring"></div><div class="radar-dot"></div>
                    </div>
                    <div class="loading-text">Engine Processing Payload...</div>
                    <div class="loading-log" id="loading-log">${this.loadingMessages[0]}</div>
                </div>`;

            const logEl = document.getElementById('loading-log');
            this.loadingInterval = setInterval(() => {
                msgIdx = (msgIdx + 1) % this.loadingMessages.length;
                if (logEl) logEl.textContent = this.loadingMessages[msgIdx];
            }, 800);
        } else {
            if (this.loadingInterval) clearInterval(this.loadingInterval);
        }
    }

    buildPrompt(input, type) {
        // Drastically simplified prompt since the Schema handles the formatting now
        return `You are an automated threat intelligence system performing heuristic analysis.
Analyze the following ${type} payload for phishing, scam, or malicious indicators.

[PAYLOAD TYPE]: ${type}
[PAYLOAD DATA]:
${input}

Analyze against the following vectors:
- Domain spoofing / typosquatting
- Urgency and fear tactics
- Suspicious TLDs
- Obfuscated URLs
- Phishing indicators (requests for OTP, passwords)
- Impersonation of government/financial institutions
- Malicious APK naming conventions

RULES:
1. "verdict" MUST be exactly "SAFE", "SUSPICIOUS", or "PHISHING".
2. "risk_score" MUST be an integer between 0 and 100.
3. "level" MUST be exactly "danger", "warning", or "info".`;
    }

    showResult(r, input) {
        const verdict = (r.verdict || 'SUSPICIOUS').toUpperCase();
        const v = verdict === 'SAFE' ? 'safe' : verdict === 'PHISHING' ? 'phishing' : 'suspicious';
        const icons = { safe: '✓', suspicious: '!', phishing: '✕' };
        const labels = { safe: 'Safe', suspicious: 'Suspicious', phishing: 'Phishing Detected' };
        const score = r.risk_score ?? 0;

        const flagsHtml = (r.flags || []).map(f => {
            const lvl = f.level === 'danger' ? 'danger' : f.level === 'warning' ? 'warning' : 'info';
            const sym = lvl === 'danger' ? '✕' : lvl === 'warning' ? '!' : 'i';
            return `<div class="flag-item"><div class="flag-icon fi-${lvl}">${sym}</div><span>${this.escapeHtml(f.text)}</span></div>`;
        }).join('');

        this.dom.resultArea.innerHTML = `
            <div class="result-wrap">
                <div class="verdict-header verdict-${v}">
                    <div class="verdict-icon-wrap icon-${v}">${icons[v]}</div>
                    <div class="verdict-info">
                        <div class="verdict-label label-${v}">${labels[v]}</div>
                        <div class="verdict-summary">${this.escapeHtml(r.summary || '')}</div>
                    </div>
                    <div class="risk-badge"><div class="risk-num risk-${v}">${score}</div><div class="risk-tag">/ 100 risk</div></div>
                </div>
                <div class="risk-bar-section">
                    <div class="bar-label-row"><span>Threat Matrix Index</span><span>${score}/100</span></div>
                    <div class="risk-track"><div class="risk-fill fill-${v}" id="risk-fill-bar" style="width:0%"></div></div>
                </div>
                ${flagsHtml ? `<div class="flags-section"><div class="flags-title">Identified Vectors</div><div class="flag-list">${flagsHtml}</div></div>` : ''}
                <div class="rec-section">
                    <div class="rec-box rec-${v}"><strong>Action Protocol:</strong>&nbsp;${this.escapeHtml(r.recommendation || 'Exercise caution.')}</div>
                </div>
            </div>`;

        requestAnimationFrame(() => { setTimeout(() => { const bar = document.getElementById('risk-fill-bar'); if (bar) bar.style.width = `${score}%`; }, 100); });
        setTimeout(() => this.dom.resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    }

    showError(msg) {
        this.dom.resultArea.innerHTML = `<div style="margin-top:1.25rem;padding:1rem 1.5rem;background:rgba(255,58,58,0.08);border:1px solid rgba(255,58,58,0.2);border-radius:12px;font-size:13px;color:var(--red);font-family:var(--font-mono);line-height:1.7;"><strong>[TERMINATED]</strong> ${this.escapeHtml(msg)}</div>`;
    }

    addToHistory(input, result) {
        this.scanHistory.unshift({ id: Date.now(), input, type: this.currentTab, verdict: result.verdict, score: result.risk_score, summary: result.summary, ts: new Date().toLocaleTimeString() });
        if (this.scanHistory.length > 15) this.scanHistory.pop();
        localStorage.setItem('phishguard_history', JSON.stringify(this.scanHistory));
        this.renderHistory();
    }

    renderHistory() {
        if (!this.scanHistory.length) { this.dom.histSection.style.display = 'none'; return; }
        this.dom.histSection.style.display = 'block';
        this.dom.histList.innerHTML = this.scanHistory.map(h => {
            const v = (h.verdict || 'suspicious').toLowerCase();
            const txt = h.input.length > 60 ? h.input.slice(0, 60) + '…' : h.input;
            return `<div class="history-item" data-id="${h.id}"><span class="hist-badge badge-${v}">${h.verdict}</span><span class="hist-text">${this.escapeHtml(txt)}</span><span class="hist-type">${h.type.toUpperCase()}</span><span class="hist-score">${h.score}/100</span><span class="hist-type">${h.ts}</span></div>`;
        }).join('');
        document.querySelectorAll('.history-item').forEach(item => { item.addEventListener('click', () => this.loadHistory(parseInt(item.dataset.id))); });
    }

    loadHistory(id) {
        const entry = this.scanHistory.find(h => h.id === id);
        if (!entry) return;
        this.switchTab(entry.type);
        this.dom.inputEl.value = entry.input;
        this.handleInput();
        this.showResult({ verdict: entry.verdict, risk_score: entry.score, summary: entry.summary, flags: [], recommendation: 'Loaded from telemetry logs.' }, entry.input);
        document.getElementById('scanner').scrollIntoView({ behavior: 'smooth' });
    }

    clearHistory() { this.scanHistory = []; localStorage.removeItem('phishguard_history'); this.renderHistory(); }

    animateStats() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.querySelectorAll('.stat-num').forEach(el => {
                    const target = parseFloat(el.dataset.target);
                    const isFloat = String(target).includes('.');
                    const start = performance.now();
                    const animate = now => {
                        const p = Math.min((now - start) / 1500, 1);
                        const val = target * (1 - Math.pow(1 - p, 3));
                        el.textContent = isFloat ? val.toFixed(1) : Math.round(val);
                        if (p < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                });
                observer.disconnect();
            });
        }, { threshold: 0.3 });
        const statsEl = document.querySelector('.stats-section');
        if (statsEl) observer.observe(statsEl);
    }

    updateNavActiveState() {
        let current = '';
        ['scanner', 'how-it-works', 'stats'].forEach(id => { const el = document.getElementById(id); if (el && window.scrollY >= el.offsetTop - 120) current = id; });
        this.dom.navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + current));
    }

    escapeHtml(str) { return typeof str !== 'string' ? '' : str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.PhishGuard = new PhishGuardApp(); window.PhishGuard.init(); });
} else {
    window.PhishGuard = new PhishGuardApp();
    window.PhishGuard.init();
}