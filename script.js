// ── PREMIUM PAGE LOAD SEQUENCE ───────────────────────────────────
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

function animateIn(el, delay, opts = {}) {
    const dur = opts.dur || 750;
    el.style.transition = `opacity ${dur}ms ${EASE} ${delay}ms, transform ${dur}ms ${EASE} ${delay}ms`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0) scale(1)';
        });
    });
}

window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    const nav = document.getElementById('main-nav');
    const heroItems = document.querySelectorAll('.hero-animate');

    // Brief loader, then orchestrate entry
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }

        // 1. Nav slides in
        if (nav) animateIn(nav, 0, { dur: 700 });

        // 2. Hero elements stagger
        heroItems.forEach((el, i) => {
            animateIn(el, 120 + i * 90, { dur: 800 });
        });
    }, 600);
});

// ── SCROLL EFFECTS ────────────────────────────────────────────────
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
});

// Mobile Drawer Toggle
function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (drawer) {
        drawer.classList.toggle('active');
        document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
    }
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── PARTICLE SYSTEM ───────────────────────────────────────────────
(function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const hero = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    let W, H, particles, mouse = { x: -9999, y: -9999 };

    const PARTICLE_COUNT = 72;
    const CONNECT_DIST = 110;
    const REPEL_DIST = 90;
    const REPEL_FORCE = 0.6;
    const SPEED = 0.28;

    function resize() {
        W = canvas.width = hero.offsetWidth;
        H = canvas.height = hero.offsetHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - .5) * SPEED,
            vy: (Math.random() - .5) * SPEED,
            r: Math.random() * 1.5 + .8,
            opacity: Math.random() * .35 + .1,
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        particles.forEach(p => {
            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_DIST && dist > 0) {
                const force = (REPEL_DIST - dist) / REPEL_DIST * REPEL_FORCE;
                p.vx += (dx / dist) * force * .06;
                p.vy += (dy / dist) * force * .06;
            }

            // Damping
            p.vx *= .992;
            p.vy *= .992;

            // Clamp speed
            const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (spd > SPEED * 3) { p.vx *= SPEED * 3 / spd; p.vy *= SPEED * 3 / spd; }

            p.x += p.vx;
            p.y += p.vy;

            // Wrap
            if (p.x < -10) p.x = W + 10;
            if (p.x > W + 10) p.x = -10;
            if (p.y < -10) p.y = H + 10;
            if (p.y > H + 10) p.y = -10;

            // Draw dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(66,133,244,${p.opacity})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    const alpha = (1 - dist / CONNECT_DIST) * .12;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(66,133,244,${alpha})`;
                    ctx.lineWidth = .8;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    hero.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    window.addEventListener('resize', () => { resize(); });

    init();
    draw();
})();

// ── UI TOGGLE & FILE UPLOAD ──────────────────────────────────────
function clearAnalysisResults() {
    const workspace = document.getElementById('workspace');
    if (workspace) workspace.classList.add('hidden');
    const badge = document.getElementById('detection-badge');
    if (badge) badge.classList.add('hidden');
}

function refreshRunButtonState() {
    const btn = document.getElementById('run-analysis-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Run Analysis`;
    }
}

function setDecisionType(clickedBtn, type) {
    document.querySelectorAll('.decision-btn').forEach(btn => {
        btn.classList.remove('decision-option--active', 'ring-2', 'ring-red-500', 'animate-pulse');
        btn.setAttribute('aria-pressed', 'false');
    });

    clickedBtn.classList.add('decision-option--active');
    clickedBtn.setAttribute('aria-pressed', 'true');
    
    window.currentDecisionType = type;
    
    // Clear mismatch warnings when user makes a choice
    const banner = document.getElementById('mismatch-warning-banner');
    if (banner) banner.classList.add('hidden');

    clearAnalysisResults();
    refreshRunButtonState();
}

function clearAnalysisResults() {
    const workspace = document.getElementById('workspace');
    if (workspace) workspace.classList.add('hidden');
    const badge = document.getElementById('detection-badge');
    if (badge) badge.classList.add('hidden');
    const explanation = document.getElementById('explanation-section');
    if (explanation) explanation.classList.add('hidden');
    const metrics = document.getElementById('metrics-panels');
    if (metrics) metrics.classList.add('hidden');
}

function setSubnav(clickedBtn, targetId) {
    const activeClasses = ['bg-white/10', 'text-white'];
    const inactiveClasses = ['text-gray-400', 'hover:text-white'];
    
    document.querySelectorAll('.subnav-btn').forEach(btn => {
        btn.classList.remove(...activeClasses);
        btn.classList.add(...inactiveClasses);
    });
    
    clickedBtn.classList.remove(...inactiveClasses);
    clickedBtn.classList.add(...activeClasses);
    
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
            // Offset for the fixed headers
            const y = el.getBoundingClientRect().top + window.scrollY - 150;
            window.scrollTo({top: y, behavior: 'smooth'});
        }
    }
}

// ── WHAT-IF INTERACTIONS ──────────────────────────────────────────
function setActive(btn, group) {
    btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function updateWhatIf() { /* backwards compatibility hook */ }

async function triggerWhatIf() {
    if (!window.currentWhatIfState || !window.currentActiveDomain) return;
    
    document.getElementById('whatif-decision').textContent = "CALCULATING...";
    document.getElementById('whatif-decision').style.color = "#9CA3AF";
    document.getElementById('whatif-confidence').textContent = "--%";
    
    try {
        const endpoint = `/api/analyze/what-if`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                model_type: window.currentActiveDomain, 
                features: window.currentWhatIfState 
            })
        });
        
        const result = await response.json();
        
        const decEl = document.getElementById('whatif-decision');
        const confEl = document.getElementById('whatif-confidence');
        
        const newDec = result.decision;
        if(newDec) {
            decEl.textContent = newDec.toUpperCase();
            
            const positiveOutcomes = ['HIRE', 'APPROVED', 'ADMITTED', 'SELECTED'];
            if (positiveOutcomes.includes(newDec.toUpperCase())) {
                decEl.style.color = '#00D64F';
            } else {
                decEl.style.color = '#EF4444';
            }
        }
        
        if (result.confidence_score) {
            confEl.textContent = Math.round(result.confidence_score) + '%';
        }
        
    } catch (e) {
        console.error("What-If Simulation Failed", e);
        document.getElementById('whatif-decision').textContent = "ERROR";
    }
}

// ── VOICE DICTATION ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const voiceBtn = document.getElementById('voice-input-btn');
    const textArea = document.getElementById('candidate-input');
    
    if (voiceBtn && textArea) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            const recognition = new SpeechRec();
            recognition.continuous = true;
            recognition.interimResults = true;
            
            let isRecording = false;
            let final_transcript = '';
            let original_text = '';
            
            recognition.onstart = () => {
                isRecording = true;
                original_text = textArea.value;
                if (original_text && !original_text.endsWith(" ") && !original_text.endsWith("\n")) {
                    original_text += " ";
                }
                final_transcript = '';
                voiceBtn.classList.remove('bg-gray-700/50', 'text-gray-400', 'hover:bg-blue-500/50');
                voiceBtn.classList.add('bg-red-500/20', 'text-red-500', 'border', 'border-red-500/50', 'animate-pulse');
            };
            
            recognition.onresult = (event) => {
                let interim_transcript = '';
                
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    } else {
                        interim_transcript += event.results[i][0].transcript;
                    }
                }
                
                textArea.value = original_text + final_transcript + interim_transcript;
            };
            
            const stopRecording = () => {
                isRecording = false;
                voiceBtn.classList.add('bg-gray-700/50', 'text-gray-400', 'hover:bg-blue-500/50');
                voiceBtn.classList.remove('bg-red-500/20', 'text-red-500', 'border', 'border-red-500/50', 'animate-pulse');
            };
            
            recognition.onerror = stopRecording;
            recognition.onend = stopRecording;
            
            voiceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isRecording) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
        } else {
            voiceBtn.style.display = 'none';
        }
    }
});

const HIRING_WEIGHTS = { skills: 30, experience: 25, projects: 20, communication: 15, education: 10 };
const COLLEGE_WEIGHTS = { academics: 30, projects: 25, achievements: 20, communication: 15, preparation: 10 };
const LOAN_WEIGHTS = { creditScore: 35, income: 25, repayment: 20, debt: 10, loanAffordability: 10 };

const LEVEL_MAP = { high: 1.0, medium: 0.6, low: 0.3, none: 0 };

function getLoanValidationSignals(text) {
    const lower = text.toLowerCase();
    return {
        applicantIdentity: ['applicant', 'borrower', 'customer'].some(k => lower.includes(k)),
        incomeEarnings: [
            'income', 'salary', 'earnings', 'irregular earnings', 'unstable income', 'stable income'
        ].some(k => lower.includes(k)),
        creditFinancialHistory: [
            'credit score', 'credit history', 'financial history', 'poor financial history', 'excellent credit profile'
        ].some(k => lower.includes(k)),
        debtLiability: [
            'debt', 'liabilities', 'existing loans', 'outstanding loans'
        ].some(k => lower.includes(k)),
        repaymentDefault: [
            'repayment', 'default', 'defaults', 'missed payments', 'delayed payments', 'no defaults', 'strong repayment history', 'past loan defaults'
        ].some(k => lower.includes(k)),
        risk: [
            'repayment risk', 'high risk', 'low risk', 'financial risk'
        ].some(k => lower.includes(k)),
    };
}

function detectInputType(text) {
    const lower = (text || "").toLowerCase();

    // NEW: Weighted scoring system (always returns best match).
    let hiringScore = 0;
    let loanScore = 0;
    let collegeScore = 0;

    const tokens = lower
        .split(/[^a-z0-9]+/g)
        .filter(Boolean);

    const scoreToken = (token, strong, medium, weak) => {
        const inList = (list) =>
            list.some((k) => (k.endsWith("*") ? token.startsWith(k.slice(0, -1)) : token === k));

        if (inList(strong)) return 3;
        if (inList(medium)) return 2;
        if (inList(weak)) return 1;
        return 0;
    };

    const HIRING = {
        strong: ['candidate', 'experience', 'worked', 'engineer', 'developer'],
        medium: ['skills', 'project*', 'task*', 'contribut*', 'team', 'debug*'],
        weak: ['communication', 'learning', 'coding'],
    };

    const LOAN = {
        strong: ['applicant', 'credit', 'loan', 'repayment', 'default*'],
        medium: ['income', 'salary', 'debt', 'liabilit*'],
        weak: ['financial', 'risk', 'profile'],
    };

    const COLLEGE = {
        strong: ['student', 'marks', 'percentage', 'school', 'admission'],
        medium: ['project*', 'academic*', 'exam*', 'subject*'],
        weak: ['performance', 'participation'],
    };

    tokens.forEach((token) => {
        hiringScore += scoreToken(token, HIRING.strong, HIRING.medium, HIRING.weak);
        loanScore += scoreToken(token, LOAN.strong, LOAN.medium, LOAN.weak);
        collegeScore += scoreToken(token, COLLEGE.strong, COLLEGE.medium, COLLEGE.weak);
    });

    // CRITICAL FIX: edge case → never fail; default to HIRING with low confidence.
    const maxScore = Math.max(hiringScore, loanScore, collegeScore);

    let type = 'HIRING';
    if (maxScore === loanScore && loanScore > hiringScore && loanScore >= collegeScore) type = 'LOAN_APPROVAL';
    else if (maxScore === collegeScore && collegeScore > hiringScore && collegeScore > loanScore) type = 'COLLEGE_ADMISSION';

    let confidence = 50;
    if (maxScore <= 1) {
        confidence = 50; // low confidence default range
    } else {
        // Scale based on strength of best match and separation from runner-up.
        const sorted = [hiringScore, loanScore, collegeScore].sort((a, b) => b - a);
        const gap = sorted[0] - (sorted[1] ?? 0);
        confidence = Math.max(40, Math.min(95, Math.round(50 + maxScore * 3 + gap * 4)));
    }

    console.log("Scores:", { hiringScore, loanScore, collegeScore });
    console.log("Detected:", type);

    return { type, confidence };
}

function validateSelectedType(text, selectedType) {
    const detection = detectInputType(text);

    // Map internal types to user-friendly labels
    const typeMap = {
        'HIRING': 'hiring',
        'COLLEGE_ADMISSION': 'admission',
        'LOAN_APPROVAL': 'loan'
    };
    
    const labelMap = {
        'HIRING': 'Hiring / Resume Screening',
        'COLLEGE_ADMISSION': 'College Admission',
        'LOAN_APPROVAL': 'Loan Approval'
    };

    if (typeMap[detection.type] !== selectedType) {
        return { 
            success: false, 
            errorType: "TYPE_MISMATCH",
            detectedType: labelMap[detection.type],
            message: `Please select the appropriate option. Most likely: ${labelMap[detection.type]}.`
        };
    }

    return { success: true };
}

function showMismatchWarning(detectedLabel) {
    const banner = document.getElementById('mismatch-warning-banner');
    const textEl = document.getElementById('mismatch-warning-text');
    if (!banner || !textEl) return;

    textEl.textContent = `Please select the appropriate option. Most likely: ${detectedLabel}.`;
    banner.classList.remove('hidden');
    
    // Highlight suggested card
    const idMap = {
        'Hiring / Resume Screening': 'btn-hiring',
        'College Admission': 'btn-admission',
        'Loan Approval': 'btn-loan'
    };
    
    const targetId = idMap[detectedLabel];
    const targetBtn = document.getElementById(targetId);
    if (targetBtn) {
        targetBtn.classList.add('ring-2', 'ring-red-500', 'animate-pulse');
    }
}

function matchesHiringExperience(text) {
    const lower = text.toLowerCase();
    const patterns = [
        /\b\d+\s*\+?\s*years?\b/,
        /\byears?\b/,
        /\bworked\b/,
        /\bexperience\b/,
        /\bengineer\b/,
        /\bdeveloper\b/,
        /\bintern(ship)?\b/,
    ];
    return patterns.some(pattern => pattern instanceof RegExp ? pattern.test(lower) : lower.includes(pattern));
}

function matchesHiringSkills(text) {
    const lower = text.toLowerCase();
    const patterns = [
        /\bskills?\b/,
        /\bpython\b/,
        /\bdebug(ging)?\b/,
        /\bdevelopment\b/,
        /\bbackend\b/,
        /\bfrontend\b/,
        /\bapi(s)?\b/,
        /\bnode(\.js)?\b/,
        /\bsystem design\b/,
        /\bproblem solving\b/,
    ];
    return patterns.some(pattern => pattern instanceof RegExp ? pattern.test(lower) : lower.includes(pattern));
}

function matchesHiringProjects(text) {
    const lower = text.toLowerCase();
    const patterns = [
        /\bbuilt\b/,
        /\bdeveloped\b/,
        /\boptimized\b/,
        /\bcontributed\b/,
        /\bapi(s)?\b/,
        /\bsystems?\b/,
        /\bplatforms?\b/,
        /\bservices?\b/,
        /\bscalable\b/,
        /\bperformance\b/,
    ];
    return patterns.some(pattern => pattern instanceof RegExp ? pattern.test(lower) : lower.includes(pattern));
}

function matchesHiringCommunication(text) {
    const lower = text.toLowerCase();
    const patterns = [
        /\bcommunication\b/,
        /\bcommunicat(es|ed|ing)?\b/,
        /\bteam\b/,
        /\bcollaboration\b/,
        /\bcollaborat(es|ed|ing)?\b/,
        /\bcross-functional\b/,
        /\bstakeholders?\b/,
    ];
    return patterns.some(pattern => pattern instanceof RegExp ? pattern.test(lower) : lower.includes(pattern));
}

function validateInput(text, type) {
    const lower = text.toLowerCase();
    if (text.length < 20) return { valid: false, message: 'Input too short.' };

    if (type === 'HIRING') {
        const validationSignals = {
            experience: matchesHiringExperience(text),
            skills: matchesHiringSkills(text),
            projects: matchesHiringProjects(text),
            communication: matchesHiringCommunication(text),
        };
        const count = Object.values(validationSignals).filter(Boolean).length;

        console.log("Detected Type:", type);
        console.log("Validation Signals:", validationSignals);
        console.log("Validation Count:", count);

        if (count < 2) return { valid: false, message: 'Input is incomplete for detected type.' };
    } else if (type === 'COLLEGE_ADMISSION') {
        const matches = ['marks', 'academics', '%', 'projects', 'achievements', 'communication'].filter(k => lower.includes(k));
        if (matches.length < 2) return { valid: false, message: 'Input is incomplete for detected type.' };
    } else if (type === 'LOAN_APPROVAL') {
        const loanSignals = getLoanValidationSignals(text);
        const count = Object.values(loanSignals).filter(Boolean).length;

        console.log("Detected Type:", type);
        console.log("Loan Validation Signals:", loanSignals);
        console.log("Loan Validation Count:", count);

        if (count < 2) return { valid: false, message: 'Input is incomplete for detected type.' };
    }
    return { valid: true };
}

async function callGemmaAPI(text, type) {
    const lower = text.toLowerCase();
    const extract = (keywords, highKeys = [], medKeys = [], lowKeys = [], noneKeys = []) => {
        if (noneKeys.some(k => lower.includes(k))) return 'none';
        if (highKeys.some(k => k instanceof RegExp ? k.test(lower) : lower.includes(k))) return 'high';
        if (medKeys.some(k => k instanceof RegExp ? k.test(lower) : lower.includes(k))) return 'medium';
        if (lowKeys.some(k => k instanceof RegExp ? k.test(lower) : lower.includes(k))) return 'low';
        
        const matches = keywords.filter(k => k instanceof RegExp ? k.test(lower) : lower.includes(k)).length;
        if (matches >= 3) return 'high';
        if (matches >= 1) return 'medium';
        return 'low';
    };

    if (type === 'HIRING') {
        return {
            skills: extract(['python', 'node.js', 'ml', 'ai', 'system design', 'backend'], ['strong skills', 'expertise', 'specialist'], ['decent', 'moderate', 'satisfactory'], ['basic knowledge', 'limited']),
            experience: extract([/[3-9] years/], ['4 years', '3 years', 'expertise'], [/[1-2](\.[0-9])? years/, '2 years', 'some experience'], ['basic experience'], ['no experience', 'no real-world experience']),
            projects: extract(['scalable', 'real-world', 'multiple'], ['multiple scalable', 'built multiple'], ['few', 'academic', 'small', 'couple of'], [], ['no projects', 'no completed projects']),
            communication: extract(['analytical thinking', 'problem solving'], ['excellent communication', 'strong communication'], ['satisfactory', 'average'], ['weak', 'poor']),
            education: lower.includes('degree') || lower.includes('university') ? 'high' : 'medium'
        };
    } else if (type === 'COLLEGE_ADMISSION') {
        return {
            academics: extract([/9[0-9]%/, /8[5-9]%/], ['95%', 'excellent science', 'excellent mathematics'], [/7[0-9]%/, /6[5-9]%/], [/5[0-9]%/, /4[0-9]%/], ['fail']),
            projects: extract(['ai', 'programming', 'robotics'], ['multiple ai projects', 'multiple robotics'], ['one project', 'basic project']),
            achievements: extract(['national-level', 'hackathons'], ['competitions', 'medals', 'awards']),
            communication: extract(['leadership'], ['excellent', 'strong communication'], ['average']),
            preparation: extract(['preparation', 'years'], ['robotics experience'], ['some'])
        };
    } else if (type === 'LOAN_APPROVAL') {
        const credit = extract(
            [/7[5-9][0-9]/, /8[0-9]{2}/, 'excellent credit profile'],
            ['760', 'excellent credit', 'excellent credit profile'],
            [/[6][5-9][0-9]/, /7[0-4][0-9]/, 'credit history', 'financial history'],
            [/5[0-9]{2}/, /4[0-9]{2}/, 'poor financial history', 'poor credit history', 'bad credit history', 'poor credit'],
            ['no history']
        );
        const income = extract(
            [/50000/, /4[0-9]{4}/, /6[0-9]{4}/],
            ['stable income', 'consistent income', 'high salary', 'consistent earnings'],
            ['moderate income', 'salary', 'income', 'earnings'],
            ['unstable income', 'irregular earnings', 'low income'],
            []
        );
        const repayment = extract(
            ['history', 'ontime', 'repayment'],
            ['strong repayment', 'no defaults', 'no previous loan defaults', 'strong repayment history'],
            ['partial', 'repayment'],
            ['default', 'defaults', 'poor repayment', 'past loan defaults', 'missed payments', 'delayed payments', 'high repayment risk'],
            []
        );
        const debt = extract(
            ['debt', 'liabilities', 'existing loans', 'outstanding loans', 'debt-to-income ratio'],
            ['low debt', 'low debt-to-income ratio'],
            ['some debt', 'existing loans', 'moderate debt'],
            ['high debt', 'high debt-to-income ratio', 'outstanding', 'liabilities', 'outstanding loans'],
            []
        );
        const risk = extract(
            ['loan amount', 'affordable', 'repayment risk', 'financial risk', 'risk'],
            ['low amount', 'affordable', 'low risk'],
            ['loan amount', 'risk'],
            ['high repayment risk', 'high risk', 'financial risk', 'very high'],
            []
        );

        console.log("Loan Signals:", {
            credit,
            income,
            repayment,
            debt
        });

        return {
            creditScore: credit,
            income,
            repayment,
            debt,
            loanAffordability: risk
        };
    }
}

function calculateScore(signals, type, text) {
    let baseScore = 0;
    let weights = HIRING_WEIGHTS;
    if (type === 'COLLEGE_ADMISSION') weights = COLLEGE_WEIGHTS;
    if (type === 'LOAN_APPROVAL') weights = LOAN_WEIGHTS;

    const breakdown = {};
    for (const key in weights) {
        const level = signals[key] || 'low';
        const points = (LEVEL_MAP[level] || 0.3) * weights[key];
        baseScore += points;
        breakdown[key] = { level, points };
    }

    let score = baseScore;
    let decision = "REVIEW";

    if (type === 'HIRING') {
        // Force Rules
        if (signals.experience === 'high' && signals.skills === 'high' && signals.projects === 'high') score = Math.max(score, 80);
        if (signals.experience === 'medium' && signals.skills === 'medium' && signals.projects === 'medium') score = Math.max(score, 55);
        if (signals.experience === 'none' && signals.projects === 'none' && (signals.skills === 'low' || signals.skills === 'none')) score = Math.min(score, 45);

        if (score >= 70) decision = "SELECTED";
        else if (score >= 55) decision = "REVIEW";
        else decision = "NOT SELECTED";
    } else if (type === 'COLLEGE_ADMISSION') {
        if (signals.academics === 'high' && signals.projects === 'high' && signals.achievements === 'high') score = Math.max(score, 85);
        if (signals.academics === 'medium' && signals.projects === 'medium') score = Math.max(score, 55);
        if (signals.academics === 'low' && signals.projects === 'none') score = Math.min(score, 45);

        if (score >= 70) decision = "ADMITTED";
        else if (score >= 55) decision = "REVIEW";
        else decision = "NOT ADMITTED";
    } else if (type === 'LOAN_APPROVAL') {
        if (signals.creditScore === 'high' && signals.income === 'high' && signals.repayment === 'high') score = Math.max(score, 80);
        if (signals.creditScore === 'high' && signals.income === 'high' && signals.repayment === 'high' && signals.debt === 'high') {
            score = Math.max(score, 85);
        }
        if (signals.creditScore === 'medium' && signals.income === 'medium' && signals.repayment !== 'low') score = Math.max(score, 55);
        if (signals.creditScore === 'low' && signals.income === 'low' && signals.debt === 'low') score = Math.min(score, 35);
        if (signals.creditScore === 'low' && signals.income === 'low' && signals.repayment === 'low') score = Math.min(score, 30);
        if (signals.repayment === 'low' && signals.loanAffordability === 'low') score = Math.min(score, 35);

        if (score >= 70) decision = "APPROVED";
        else if (score >= 55) decision = "REVIEW";
        else decision = "REJECTED";

        console.log("Loan Score Breakdown:", breakdown);
        console.log("Score:", score);
        console.log("Decision:", decision);
        console.log("Loan Decision:", decision);
    }

    return { score, baseScore, breakdown, decision };
}

function calculateFairness(text) {
    const lower = text.toLowerCase();
    let biasPenalty = 0;
    
    // Gender bias detection
    const genderWords = ['he', 'she', 'male', 'female', 'his', 'her', 'man', 'woman'];
    const genderMatches = genderWords.filter(w => new RegExp(`\\b${w}\\b`).test(lower)).length;
    const genderPenalty = Math.min(15, genderMatches * 5);
    biasPenalty += genderPenalty;
    
    // Age bias detection
    const ageWords = ['young', 'old', 'senior', 'junior', 'fresher', 'age', 'years old'];
    const ageMatches = ageWords.filter(w => lower.includes(w)).length;
    const agePenalty = Math.min(15, ageMatches * 4);
    biasPenalty += agePenalty;
    
    // Education/Status bias detection
    const eduPatterns = ['premium university', 'ivy league', 'top tier', 'privileged', 'mr.', 'mrs.', 'sir', 'madam'];
    const eduMatches = eduPatterns.filter(p => lower.includes(p)).length;
    const eduPenalty = Math.min(15, eduMatches * 5);
    biasPenalty += eduPenalty;

    // Location bias
    const locationPatterns = ['rural', 'urban', 'village', 'native of'];
    if (locationPatterns.some(p => lower.includes(p))) biasPenalty += 5;
    
    return {
        fairness: Math.max(0, 100 - biasPenalty),
        penalties: { gender: genderPenalty, age: agePenalty, education: eduPenalty }
    };
}

function calculateConfidence(text, signals) {
    const completeness = Math.min(1, text.length / 500);
    const levels = Object.values(signals).map(l => LEVEL_MAP[l]);
    const avgSignal = levels.reduce((a, b) => a + b, 0) / levels.length;
    return Math.round((completeness * 0.3 + avgSignal * 0.7) * 100);
}

function getExplanation(signals, type, text = '') {
    if (type === 'LOAN_APPROVAL') {
        const lower = text.toLowerCase();
        const reasons = [];

        if (lower.includes('poor financial history') || signals.creditScore === 'low') reasons.push('poor financial history');
        if (lower.includes('irregular earnings') || lower.includes('unstable income') || signals.income === 'low') reasons.push('irregular earnings');
        if (lower.includes('past loan defaults') || lower.includes('defaults') || signals.repayment === 'low') reasons.push('past defaults');
        if (lower.includes('repayment risk') || lower.includes('high risk') || signals.loanAffordability === 'low') reasons.push('high repayment risk');

        if (reasons.length > 0) {
            return `Rejected due to ${Array.from(new Set(reasons)).join(', ')}.`;
        }
    }

    const high = Object.keys(signals).filter(k => signals[k] === 'high');
    const medium = Object.keys(signals).filter(k => signals[k] === 'medium');
    let parts = [];
    if (high.length > 0) parts.push(`Strong signals in ${high.join(', ')}`);
    if (medium.length > 0) parts.push(`${medium.join(', ')} level signals detected`);
    return parts.join('. ') || "Limited feature signals detected in the profile.";
}

function fairAiNormalizeDecisionType(mt) {
    const s = String(mt || '').trim();
    const u = s.toUpperCase().replace(/-/g, '_');
    if (u === 'HIRING' || u === 'HIRE') return 'HIRING';
    if (u === 'LOAN_APPROVAL' || u === 'LOAN') return 'LOAN_APPROVAL';
    if (u === 'COLLEGE_ADMISSION' || u === 'ADMISSION' || u === 'COLLEGE') return 'COLLEGE_ADMISSION';
    const l = s.toLowerCase();
    if (l === 'loan') return 'LOAN_APPROVAL';
    if (l === 'admission') return 'COLLEGE_ADMISSION';
    if (l === 'hiring') return 'HIRING';
    return 'HIRING';
}

function fairAiModelTypeToDetection(mt) {
    return { type: fairAiNormalizeDecisionType(mt), confidence: 85 };
}

function fairAiDriverKeysForType(domainType) {
    if (domainType === 'COLLEGE_ADMISSION') return ['academics', 'projects', 'achievements'];
    if (domainType === 'LOAN_APPROVAL') return ['creditScore', 'income', 'repayment'];
    return ['skills', 'experience', 'projects'];
}

function fairAiSignalsHaveDrivers(signals, domainType) {
    const levels = new Set(['high', 'medium', 'low', 'none']);
    return fairAiDriverKeysForType(domainType).some((k) => levels.has(String(signals[k] || '').toLowerCase()));
}

/**
 * Map ML API payload + optional auto-detection into the same shape desktop updateUI() expects.
 * Fills signal drivers via callGemmaAPI when fairness_metrics are not usable.
 */
async function fairAiBuildFinalDataFromBackend(backendData, detection, profileText) {
    const det = detection && detection.type
        ? { ...detection, type: fairAiNormalizeDecisionType(detection.type) }
        : fairAiModelTypeToDetection(backendData.model_type);
    const br = backendData.bias_report || {};
    const pg = br.protected_groups_impact || {};

    let fairness;
    if (br.overall_bias_score != null && !Number.isNaN(Number(br.overall_bias_score))) {
        fairness = Math.round((1 - Number(br.overall_bias_score)) * 100);
    } else {
        fairness = Math.max(0, Math.min(100, Math.round(Number(backendData.fairness_score) || 0)));
    }

    let penalties = {
        gender: Math.round((Number(pg.gender) || 0) * 100),
        age: Math.round((Number(pg.age) || 0) * 100),
        education: Math.round((Number(pg.education) || 0) * 100),
    };
    const rawText = (profileText || '').trim();
    if (penalties.gender === 0 && penalties.age === 0 && penalties.education === 0 && rawText.length >= 20) {
        penalties = calculateFairness(rawText).penalties;
    }

    let signals = Object.assign({}, backendData.fairness_metrics || {});
    delete signals.demographic_parity;

    const gemmaInput = rawText.length > 12
        ? rawText
        : JSON.stringify(backendData.structured_features || backendData.features || {});

    if (!fairAiSignalsHaveDrivers(signals, det.type)) {
        signals = await callGemmaAPI(gemmaInput, det.type);
    }

    const calc = calculateScore(signals, det.type, rawText);
    const score = Number(calc.score);

    let confidence;
    const backendConf = backendData.confidence_score;
    if (backendConf != null && !Number.isNaN(Number(backendConf))) {
        confidence = Math.round(Number(backendConf) * 100);
    } else {
        const sc = Number(backendData.score);
        confidence = Number.isFinite(sc)
            ? Math.round(sc > 50 ? sc : 100 - sc)
            : calculateConfidence(rawText || gemmaInput, signals);
    }

    const decision = backendData.decision || backendData.prediction || calc.decision;
    let explanation = backendData.explanation;
    if (!explanation || String(explanation).length < 5) {
        explanation = getExplanation(signals, det.type, rawText);
    }

    return {
        detection: det,
        signals,
        score,
        decision,
        fairness,
        penalties,
        confidence,
        explanation,
    };
}

window.fairAiNormalizeDecisionType = fairAiNormalizeDecisionType;
window.fairAiModelTypeToDetection = fairAiModelTypeToDetection;
window.fairAiDriverKeysForType = fairAiDriverKeysForType;
window.fairAiBuildFinalDataFromBackend = fairAiBuildFinalDataFromBackend;

function updateUI(data) {
    const { detection, signals, score, decision, fairness, confidence, explanation, penalties } = data;
    
    document.getElementById('workspace')?.classList.remove('hidden');
    document.getElementById('explanation-section')?.classList.remove('hidden');
    document.getElementById('metrics-panels')?.classList.remove('hidden');

    // Update Detection Badge
    const badge = document.getElementById('detection-badge');
    const typeLabel = document.getElementById('detected-type-label');
    const confLabel = document.getElementById('detection-confidence');
    
    if (badge && typeLabel && confLabel && detection) {
        badge.classList.remove('hidden');
        typeLabel.textContent = detection.type.replace(/_/g, ' ');
        confLabel.textContent = detection.confidence + '% Match';
        
        if (detection.type === 'HIRING') typeLabel.style.color = '#3B82F6';
        else if (detection.type === 'COLLEGE_ADMISSION') typeLabel.style.color = '#A855F7';
        else if (detection.type === 'LOAN_APPROVAL') typeLabel.style.color = '#F59E0B';
    }
    
    const decEl = document.getElementById('final-decision');
    if (decEl) {
        decEl.textContent = decision;
        const posDecs = ['SELECTED', 'ADMITTED', 'APPROVED'];
        const reviewDecs = ['REVIEW', 'MANUAL REVIEW', 'REVIEW / WAITLIST'];
        decEl.style.color = posDecs.includes(decision) ? '#00D64F' : (reviewDecs.includes(decision) ? '#F59E0B' : '#EF4444');
    }
    
    const confEl = document.getElementById('confidence-score');
    if (confEl) confEl.textContent = confidence;
    
    const fairEl = document.getElementById('fairness-score');
    const gauge = document.getElementById('fairnessGauge');
    if (fairEl) fairEl.textContent = fairness;
    if (gauge) {
        const offset = 251.2 - (251.2 * fairness) / 100;
        gauge.style.strokeDashoffset = offset;
        gauge.style.stroke = fairness > 80 ? '#00D64F' : (fairness > 60 ? '#F59E0B' : '#EF4444');
    }
    
    document.getElementById('gender-bias-percent').textContent = penalties.gender + '%';
    document.getElementById('gender-bias-bar').style.width = penalties.gender + '%';
    document.getElementById('age-bias-percent').textContent = penalties.age + '%'; 
    document.getElementById('age-bias-bar').style.width = penalties.age + '%';
    document.getElementById('education-bias-percent').textContent = penalties.education + '%';
    document.getElementById('education-bias-bar').style.width = penalties.education + '%';

    const driversContainer = document.getElementById('key-drivers-container');
    if (driversContainer) {
        driversContainer.innerHTML = '';
        let keys = ['skills', 'experience', 'projects'];
        if (detection.type === 'COLLEGE_ADMISSION') keys = ['academics', 'projects', 'achievements'];
        if (detection.type === 'LOAN_APPROVAL') keys = ['creditScore', 'income', 'repayment'];
        
        keys.forEach((key, idx) => {
            const level = signals[key] || 'low';
            const width = level === 'high' ? 90 : (level === 'medium' ? 60 : 30);
            const attr = level === 'high' ? 25 : (level === 'medium' ? 15 : 11);
            let color = idx === 0 ? 'blue' : (idx === 1 ? 'purple' : 'pink');
            if (detection.type === 'LOAN_APPROVAL') color = idx === 0 ? 'amber' : (idx === 1 ? 'emerald' : 'blue');
            
            driversContainer.insertAdjacentHTML('beforeend', `
                <div class="relative">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[15px] font-bold text-ink capitalize">${key.replace(/([A-Z])/g, ' $1')}</span>
                        <span class="text-${color}-400 font-bold bg-${color}-500/10 px-2 py-0.5 rounded text-[13px]">+${attr}% Attribution</span>
                    </div>
                    <div class="h-3 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div class="h-full bg-${color}-500 rounded-full transition-all duration-1000" style="width: 0%" data-target-width="${width}%"></div>
                    </div>
                </div>
            `);
        });
        setTimeout(() => {
            driversContainer.querySelectorAll('[data-target-width]').forEach(bar => { bar.style.width = bar.getAttribute('data-target-width'); });
        }, 50);
    }
    
    const expEl = document.getElementById('ai-explanation');
    if (expEl) {
        const scoreDisp = Number.isFinite(Number(score)) ? Number(score).toFixed(1) : '—';
        expEl.innerHTML = `
            <div class="space-y-4">
                <p class="text-[16px] leading-relaxed italic text-ink-2">"${explanation}"</p>
                <div class="mt-4 pt-4 border-t border-ink/10">
                    <span class="text-[12px] font-bold tracking-widest text-ink uppercase">System Insight</span>
                    <p class="text-ink font-medium mt-1">Weighted Signal Analysis: Score ${scoreDisp}/100. Integrity Check: ${fairness}%. Recommendation: ${decision}.</p>
                </div>
            </div>
        `;
    }
}

function showInputError(message) {
    const banner = document.getElementById('input-error-banner');
    const text = document.getElementById('input-error-text');
    if (!banner || !text) return;
    text.textContent = message;
    banner.classList.remove('hidden');
}

function hideInputError() {
    const banner = document.getElementById('input-error-banner');
    if (banner) banner.classList.add('hidden');
}

async function runRealAnalysis() {
    const btn = document.getElementById('run-analysis-btn');
    const inputArea = document.getElementById('candidate-input');
    if (!btn || !inputArea) return;

    const textData = inputArea.value || "";
    const selectedType = window.currentDecisionType || 'hiring';

    // Reset warnings
    const banner = document.getElementById('mismatch-warning-banner');
    if (banner) banner.classList.add('hidden');
    document.querySelectorAll('.decision-btn').forEach(b => b.classList.remove('ring-2', 'ring-red-500', 'animate-pulse'));
    hideInputError();

    // --- NEW: MISMATCH DETECTION ---
    const validationStatus = validateSelectedType(textData, selectedType);
    if (!validationStatus.success) {
        clearAnalysisResults();
        if (validationStatus.errorType === "TYPE_MISMATCH") {
            showMismatchWarning(validationStatus.detectedType);
        } else {
            showInputError(validationStatus.message);
        }
        return;
    }

    console.log("--- FairAI Debug Start ---");
    console.log("Input:", textData);
    
    // --- STEP 1: AUTO-DETECTION ---
    const detection = detectInputType(textData);
    console.log("Detected Type:", detection.type);
    
    // Detection always returns a type; keep this only as a safe fallback.
    if (!detection?.type) {
        showInputError("Unable to determine input type. Please provide clearer details.");
        return;
    }

    // --- STEP 2: STRICT VALIDATION ---
    const validation = validateInput(textData, detection.type);
    if (!validation.valid) {
        showInputError(validation.message);
        return;
    }
    hideInputError();

    btn.textContent = 'Analyzing...';
    btn.disabled = true;

    // Simulate pipeline progress
    const steps = ['input', 'bias', 'fairness', 'explain'];
    steps.forEach((step, i) => {
        setTimeout(() => {
            const el = document.getElementById(`check-${step}`);
            if (el) { el.classList.remove('hidden'); el.classList.add('opacity-100'); }
        }, i * 400);
    });

    try {
        const type = detection.type;
        
        // --- STEP 3: REAL API CALL (Aggressive Discovery) ---
        const payloads = JSON.stringify({
            model_type: type,
            features: { profile_text: textData }
        });

        const targets = [
            '/api/analyze',
            '/analyze',
            'http://localhost:8000/api/analyze',
            'http://localhost:8000/analyze',
            'http://127.0.0.1:8000/api/analyze'
        ];

        let response = null;
        let lastError = null;

        for (const target of targets) {
            try {
                const res = await fetch(target, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payloads
                });
                if (res.ok || (res.status !== 404 && res.status !== 405)) {
                    response = res;
                    break;
                }
                console.warn(`Target ${target} failed with status: ${res.status}`);
            } catch (e) {
                console.warn(`Target ${target} unreachable.`);
            }
        }

        if (!response) {
            throw new Error("Unable to reach the Analysis Engine on any known endpoint. Please ensure the backend is running.");
        }

        if (!response.ok) {
            let errorMsg = `API Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = `Error: ${errorData.error}`;
                else if (errorData.detail) errorMsg = `Detail: ${errorData.detail}`;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        
        const backendData = await response.json();
        console.log("Backend Response:", backendData);

        const finalData = await fairAiBuildFinalDataFromBackend(backendData, detection, textData);

        setTimeout(() => {
            if (typeof window.deductCredits === 'function') window.deductCredits(2);
            updateUI(finalData);
            btn.innerHTML = `<svg class="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Run Analysis`;
            btn.disabled = false;
        }, 1800);
    } catch (e) {
        console.error("Analysis Failure", e);
        showInputError(`Critical engine failure: ${e.message || "Unknown error"}`);
    } finally {
        setTimeout(() => {
            btn.innerHTML = `<svg class="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Run Analysis`;
            btn.disabled = false;
            const workspace = document.getElementById('workspace');
            if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
}

// ── BAR ANIMATIONS ON REVEAL ──────────────────────────────────────
const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.querySelectorAll('.bar-fill,.bias-bar,.shap-bar').forEach(bar => {
                const w = bar.style.width;
                bar.style.width = '0';
                setTimeout(() => bar.style.width = w, 50);
            });
        }
    });
}, { threshold: 0.2 });
document.querySelectorAll('.result-card,.bias-attr-card,.shap-list').forEach(el => barObserver.observe(el));

// ── GAUGE ANIMATION ───────────────────────────────────────────────
const gaugeArc = document.getElementById('gauge-arc');
if (gaugeArc) {
    const arcObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                gaugeArc.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)';
                gaugeArc.style.strokeDashoffset = '82';
            }
        });
    }, { threshold: 0.5 });
    arcObserver.observe(gaugeArc.closest('svg'));
    gaugeArc.style.strokeDashoffset = '314';
}

// ── SPA ROUTER ───────────────────────────────────────────────────
function showView(viewId, hash) {
    // Manage View Visibility
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    const targetView = document.getElementById(viewId + '-view');
    if (targetView) {
        targetView.classList.add('active');
        if (hash) {
            const targetEl = document.querySelector(hash);
            if (targetEl) {
                setTimeout(() => targetEl.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Manage Nav Highlights
    const analysisBtn = document.getElementById('nav-analysis');
    
    if (analysisBtn) {
        if (viewId === 'analysis') {
            analysisBtn.classList.add('active');
        } else {
            analysisBtn.classList.remove('active');
        }
    }
}

// Initialize view from hash or default
const handleRoute = () => {
    const hash = window.location.hash;
    const analysisSections = ['#workspace', '#bias', '#fairness', '#explain', '#whatif', '#trust'];
    if (analysisSections.some(s => hash.startsWith(s))) {
        showView('analysis', hash);
    } else {
        showView('home');
    }
};

window.addEventListener('load', () => showView('home'));
window.addEventListener('hashchange', handleRoute);

// ── TYPEWRITER EFFECT ──────────────────────────────────────────────
window.addEventListener('load', () => {
    const textStr = "AI That Thinks Like a Judge. Delivers Justice Faster.";
    const typeTarget = document.getElementById('typing-tagline');
    if (!typeTarget) return;

    let i = 0;
    function typeWriter() {
        if (i < textStr.length) {
            typeTarget.textContent += textStr.charAt(i);
            i++;
            setTimeout(typeWriter, 30 + Math.random() * 60); // dynamic realistic typing speed
        }
    }
    
    // Start typing after initial enter animations
    setTimeout(typeWriter, 1200);
});

// ── THEME LOGIC ──────────────────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark-mode');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Feedback animation
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.style.transform = 'scale(1.2) rotate(45deg)';
        setTimeout(() => { btn.style.transform = ''; }, 400);
    }
}

// Initialize
initTheme();

// ── TEXT TO SPEECH (NARRATOR) ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('narrator-voice-btn');
    const textTarget = document.getElementById('ai-explanation');
    const inputArea = document.getElementById('candidate-input');

    if (inputArea) {
        inputArea.addEventListener('input', () => {
            hideInputError();
        });
    }
    
    if (playBtn && textTarget) {
        let isPlaying = false;
        
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if ('speechSynthesis' in window) {
                if (isPlaying || window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                    isPlaying = false;
                    playBtn.classList.remove('bg-purple-500', 'text-white', 'animate-pulse');
                    playBtn.classList.add('bg-purple-500/10', 'text-purple-400');
                    return;
                }
                
                const textToSpeak = textTarget.innerText || textTarget.textContent;
                // Remove formatting characters/quotes if needed
                const cleanText = textToSpeak.replace(/"/g, '');
                
                const utterance = new SpeechSynthesisUtterance(cleanText);
                
                const voices = window.speechSynthesis.getVoices();
                // Try to find a premium sounding voice, fallback to anything female or natural
                const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
                if (femaleVoice) utterance.voice = femaleVoice;
                
                utterance.pitch = 1.05; // Slightly higher pitch for AI vibe
                utterance.rate = 1.0;
                
                utterance.onstart = () => {
                    isPlaying = true;
                    playBtn.classList.add('bg-purple-500', 'text-white', 'animate-pulse');
                    playBtn.classList.remove('bg-purple-500/10', 'text-purple-400');
                };
                
                utterance.onend = () => {
                    isPlaying = false;
                    playBtn.classList.remove('bg-purple-500', 'text-white', 'animate-pulse');
                    playBtn.classList.add('bg-purple-500/10', 'text-purple-400');
                };
                
                utterance.onerror = () => {
                    isPlaying = false;
                    playBtn.classList.remove('bg-purple-500', 'text-white', 'animate-pulse');
                    playBtn.classList.add('bg-purple-500/10', 'text-purple-400');
                };
                
                window.speechSynthesis.speak(utterance);
            } else {
                alert("Text-to-Speech is not supported in your browser.");
            }
        });
    }
});

// ── DRAG & DROP & SMART FILE EXTRACTION ─────────────────────────
async function fairAiBuildExtractedData(file) {
    const fileType = file.name.split(".").pop().toLowerCase();
    let extractedData = {
        type: fileType.toUpperCase(),
        title: file.name,
        content: "",
        sections: [],
        tables: [],
        summary: "",
    };

    if (fileType === "pdf") {
        extractedData = await extractFromPDF(file);
    } else if (fileType === "docx" || fileType === "doc") {
        extractedData = await extractFromDOCX(file);
    } else if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
        extractedData = await extractFromImage(file);
    } else {
        extractedData.content = await extractFromTXT(file);
    }
    return extractedData;
}

/**
 * Extract readable text from PDF / Word / image (OCR) / plain text — same pipeline as desktop upload.
 * @returns {Promise<{ ok: true, text: string } | { ok: false, error: string }>}
 */
async function fairAiExtractDocumentFile(file) {
    if (!file) return { ok: false, error: "No file selected." };
    try {
        const extractedData = await fairAiBuildExtractedData(file);
        return { ok: true, text: formatExtractedContent(extractedData) };
    } catch (e) {
        console.error("fairAiExtractDocumentFile:", e);
        return { ok: false, error: e.message || "Unable to extract text from this document." };
    }
}

window.fairAiExtractDocumentFile = fairAiExtractDocumentFile;

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const candidateInput = document.getElementById('candidate-input');
    if (!candidateInput) return;
    
    const originalValue = candidateInput.value;
    candidateInput.value = "Extracting document content...";
    candidateInput.disabled = true;

    try {
        const extractedData = await fairAiBuildExtractedData(file);
        candidateInput.value = formatExtractedContent(extractedData);
    } catch (e) {
        console.error("Extraction Error:", e);
        candidateInput.value = "Unable to extract text from this document. Please try another file.";
        setTimeout(() => { if(candidateInput.value.includes("Unable")) candidateInput.value = originalValue; }, 3000);
    } finally {
        candidateInput.disabled = false;
    }
}

async function extractFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = window["pdfjs-dist/build/pdf"] || window.pdfjsLib;
    if (!pdfjsLib || typeof pdfjsLib.getDocument !== "function") {
        throw new Error("PDF.js not loaded. Include pdf.js before script.js.");
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + "\n\n";
    }

    return {
        type: 'PDF',
        title: file.name.replace('.pdf', ''),
        content: fullText,
        sections: fullText.split('\n\n').filter(s => s.trim().length > 30).slice(0, 5),
        summary: `Document contains ${pdf.numPages} pages of structured data.`
    };
}

async function extractFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    return {
        type: 'DOCX',
        title: file.name.replace(/\.docx?$/, ''),
        content: text,
        sections: text.split('\n\n').filter(s => s.trim().length > 20).slice(0, 5),
        summary: "Word document parsed for content and structure."
    };
}

async function extractFromImage(file) {
    const result = await Tesseract.recognize(file, 'eng');
    const text = result.data.text;
    
    return {
        type: 'IMAGE (OCR)',
        title: file.name,
        content: text,
        sections: text.split('\n').filter(s => s.trim().length > 10).slice(0, 5),
        summary: "OCR extraction completed with " + Math.round(result.data.confidence) + "% confidence."
    };
}

function extractFromTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function formatExtractedContent(data) {
    if (typeof data === 'string') return data;

    let output = `Document Type: ${data.type}\n`;
    output += `Title: ${data.title}\n`;
    output += `--------------------------------------------------\n\n`;
    
    output += `Extracted Content:\n\n`;
    // Include the full, untruncated content
    output += data.content;

    if (data.summary) {
        output += `\n\n--------------------------------------------------\n`;
        output += `Summary: ${data.summary}\n`;
    }

    return output;
}

document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('upload-zone');
    const fileUploadBtn = document.getElementById('file-upload');
    
    if (uploadZone && fileUploadBtn) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => { uploadZone.classList.add('border-blue-500', 'bg-surface-3'); }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => { uploadZone.classList.remove('border-blue-500', 'bg-surface-3'); }, false);
        });
        
        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                fileUploadBtn.files = files;
                handleFileUpload({target: {files: files}});
            }
        }, false);
    }
});

// ── Shared analysis pipeline (desktop + mobile Analysis tab) ─────────
(function () {
    function fairAiApiOrigin() {
        if (typeof location === "undefined") return "";
        const h = location.hostname;
        const p = location.port || "";
        if ((h === "127.0.0.1" || h === "localhost") && p && p !== "8000" && p !== "3000" && p !== "") {
            return `http://${h === "localhost" ? "127.0.0.1" : h}:8000`;
        }
        return "";
    }

    function formatApiErr(body) {
        if (!body || typeof body !== "object") return "Request failed";
        if (typeof body.error === "string") return body.error;
        if (body.detail == null) return "Request failed";
        if (typeof body.detail === "string") return body.detail;
        if (Array.isArray(body.detail)) {
            return body.detail.map((x) => (x && typeof x === "object" && x.msg) ? x.msg : JSON.stringify(x)).join("; ");
        }
        return String(body.detail);
    }

    window.FairAiAnalysisCore = {
        fairAiApiOrigin,

        /**
         * Same guardrails as runRealAnalysis: validateSelectedType → detectInputType → validateInput → POST /api/analyze.
         * @param {string} textData - free-text profile (incl. pasted resume)
         * @param {string} selectedType - "hiring" | "loan" | "admission" (matches mobile domain dropdown)
         */
        async runAnalysis(textData, selectedType) {
            const raw = (textData || "").trim();
            if (raw.length < 20) {
                return { ok: false, message: "Input too short." };
            }

            const typeCheck = validateSelectedType(raw, selectedType);
            if (!typeCheck.success) {
                return {
                    ok: false,
                    errorType: typeCheck.errorType || "TYPE_MISMATCH",
                    message: typeCheck.message || "Selected domain does not match the text.",
                    detectedType: typeCheck.detectedType,
                };
            }

            const detection = detectInputType(raw);
            if (!detection || !detection.type) {
                return { ok: false, message: "Unable to determine input type. Please provide clearer details." };
            }

            const validation = validateInput(raw, detection.type);
            if (!validation.valid) {
                return { ok: false, message: validation.message || "Input is incomplete for this domain." };
            }

            const origin = fairAiApiOrigin();
            const response = await fetch(origin + "/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model_type: detection.type,
                    features: { profile_text: raw },
                }),
            });

            let body;
            try {
                body = await response.json();
            } catch (e) {
                body = {};
            }

            if (!response.ok) {
                return { ok: false, message: formatApiErr(body) || `API Error: ${response.status}` };
            }
            if (body.success === false) {
                return { ok: false, message: formatApiErr(body) || "Analysis failed" };
            }

            return { ok: true, detection, backendData: body };
        },
    };
})();

