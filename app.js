/**
 * RAIKHSAPEDIA - app.js
 * Netflix Token Generator Frontend Logic
 * Features: Device Detection, Token Generation, Payment Flow, Typewriter, Particles
 */

// API Base URL — diset oleh config.js
// Kosong = localhost (lokal), isi URL Railway = production
const API_BASE = window.RAIKHS_API_BASE || '';

document.addEventListener('DOMContentLoaded', () => {

    // ============================
    // DOM References
    // ============================
    const btnGenerate         = document.getElementById('btn-generate');
    const btnGeneratePremium  = document.getElementById('btn-generate-premium');
    const btnGenerateIndo     = document.getElementById('btn-generate-indo');
    const resultContainer     = document.getElementById('result-container');
    const skeletonLoader      = document.getElementById('skeleton-loader');
    const liveData            = document.getElementById('live-data');
    const statusIndicator     = document.getElementById('status-indicator');
    const statusText          = document.getElementById('status-text');

    const valName    = document.getElementById('val-name');
    const valPlan    = document.getElementById('val-plan');
    const valCountry = document.getElementById('val-country');
    const valBilling = document.getElementById('val-billing');
    const tokenLink  = document.getElementById('token-link');
    const tokenData  = document.getElementById('token-data');

    const btnCopyCookie   = document.getElementById('btn-copy-cookie');
    const btnCopyLink     = document.getElementById('btn-copy-link');
    const btnTriggerNetflix = document.getElementById('btn-trigger-netflix');
    const triggerDeviceInfo = document.getElementById('trigger-device-info');

    let isGenerating = false;

    // ============================
    // FLOATING PARTICLES
    // ============================
    function createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + 'vw';
            p.style.width = p.style.height = (Math.random() * 3 + 1.5) + 'px';
            p.style.animationDuration = (Math.random() * 18 + 12) + 's';
            p.style.animationDelay = (Math.random() * 15) + 's';
            const colors = ['#7c3aed', '#a78bfa', '#06b6d4', '#c4b5fd', '#67e8f9'];
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            container.appendChild(p);
        }
    }
    createParticles();

    // ============================
    // DEVICE DETECTION
    // ============================
    function detectDevice() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
        if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|viera|nettv|roku|philipstv|webos/i.test(ua)) return 'tv';
        return 'desktop';
    }

    function getDeviceInfo(device) {
        switch (device) {
            case 'android': return { icon: '📱', label: 'Android Terdeteksi', hint: 'Token akan dibuka di Netflix web, lalu tap logo Netflix → Open in App.' };
            case 'ios':     return { icon: '🍎', label: 'iPhone/iPad Terdeteksi', hint: 'Token akan dibuka di Netflix web, lalu tap logo Netflix → Open in App.' };
            case 'tv':      return { icon: '📺', label: 'Smart TV Terdeteksi', hint: 'Gunakan TV Code (Section 2) untuk login di Smart TV kamu.' };
            default:        return { icon: '💻', label: 'Desktop Terdeteksi', hint: 'Link akan dibuka di tab baru browser kamu.' };
        }
    }

    function initDeviceBadge() {
        const device = detectDevice();
        const info = getDeviceInfo(device);
        const badge = document.getElementById('device-badge');
        const iconEl = document.getElementById('device-icon');
        const labelEl = document.getElementById('device-label');
        if (badge && iconEl && labelEl) {
            iconEl.textContent = info.icon;
            labelEl.textContent = info.label;
        }
    }

    function setupTriggerButton() {
        const device = detectDevice();
        const info = getDeviceInfo(device);

        if (btnTriggerNetflix) {
            btnTriggerNetflix.style.display = 'inline-flex';
        }
        if (triggerDeviceInfo) {
            triggerDeviceInfo.textContent = info.hint;
        }
    }

    initDeviceBadge();
    setupTriggerButton();

    // ============================
    // TYPEWRITER EFFECT
    // ============================
    const typewriterEl = document.getElementById('typewriter-text');
    const messages = [
        'Generate token Netflix tanpa email & password.',
        'Support Mobile, Desktop, dan Smart TV.',
        'Token premium global & khusus Indonesia 🇮🇩.',
        'Aman, cepat, dan mudah digunakan.',
    ];
    let msgIdx = 0, charIdx = 0, isDeleting = false;

    function typeWriter() {
        if (!typewriterEl) return;
        const current = messages[msgIdx];
        if (!isDeleting) {
            typewriterEl.textContent = current.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === current.length) {
                isDeleting = true;
                setTimeout(typeWriter, 1800);
                return;
            }
        } else {
            typewriterEl.textContent = current.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                isDeleting = false;
                msgIdx = (msgIdx + 1) % messages.length;
            }
        }
        setTimeout(typeWriter, isDeleting ? 40 : 65);
    }
    setTimeout(typeWriter, 600);

    // ============================
    // STATUS INDICATOR
    // ============================
    function updateStatus(state, text) {
        if (!statusIndicator || !statusText) return;
        statusIndicator.className = 'status-indicator ' + state;
        statusText.textContent = text;
        if (state === 'error') {
            setTimeout(() => {
                statusIndicator.className = 'status-indicator';
                statusText.textContent = 'Ready';
            }, 3500);
        }
    }

    // ============================
    // TOAST
    // ============================
    let toastTimeout;
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.className = 'toast' + (isError ? ' toast-error' : '') + ' show';
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3200);
    }

    // ============================
    // PARSE & DISPLAY COOKIE
    // ============================
    async function parseAndDisplayCookie(rawText, countryCodeFallback) {
        let name = '--', plan = '--', country = countryCodeFallback || '--';
        let nextBilling = '--', cookieOnly = '', loginLink = '', rawNetflixId = '';

        const lines = rawText.split('\n');
        const netscapeCookieLines = [];

        lines.forEach(line => {
            line = line.trim();
            const nameMatch = line.match(/(?:name|profil|profiles?)\s*[:=]\s*(.*)/i);
            if (nameMatch && name === '--') name = nameMatch[1].trim().replace(/^-+|-+$/g, '').trim();

            const planMatch = line.match(/plan\s*[:=]\s*(.*)/i);
            if (planMatch && plan === '--') plan = planMatch[1].trim().replace(/^-+|-+$/g, '').trim();

            const countryMatch = line.match(/(?:country|region)\s*[:=]\s*(.*)/i);
            if (countryMatch) country = countryMatch[1].trim().replace(/^-+|-+$/g, '').trim();

            const billingMatch = line.match(/(?:next billing|billing date|expires?)\s*[:=]\s*(.*)/i);
            if (billingMatch && nextBilling === '--') nextBilling = billingMatch[1].trim().replace(/^-+|-+$/g, '').trim();

            if (line.includes('.netflix.com') && line.split('\t').length >= 6) {
                netscapeCookieLines.push(line);
                if (line.includes('NetflixId') && !line.includes('SecureNetflixId')) {
                    const parts = line.split('\t');
                    rawNetflixId = parts[parts.length - 1];
                }
            }
        });

        if (countryCodeFallback && (country === '--' || country.length > 3)) {
            country = countryCodeFallback.toUpperCase();
        }

        if (!rawNetflixId) return false;

        try {
            const req = await fetch(API_BASE + '/api/generate-nftoken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ netflixId: rawNetflixId })
            });
            const res = await req.json();
            if (res.token) {
                loginLink = 'https://www.netflix.com/account?nftoken=' + res.token;
            } else {
                return false;
            }
        } catch (err) {
            console.error('Failed to generate nftoken:', err);
            return false;
        }

        cookieOnly = netscapeCookieLines.length > 0 ? netscapeCookieLines.join('\n') : rawText;

        valName.textContent    = name;
        valPlan.textContent    = plan;
        valCountry.textContent = country;
        valBilling.textContent = nextBilling;
        tokenLink.value  = loginLink;
        tokenData.value  = cookieOnly;

        return true;
    }

    // ============================
    // GENERATE ACTION (MAIN)
    // ============================
    const generateAction = async (onlyPremium, onlyIndo) => {
        if (isGenerating) return;
        isGenerating = true;

        const targetBtn = onlyIndo ? btnGenerateIndo : (onlyPremium ? btnGeneratePremium : btnGenerate);
        const btnTitleEl = targetBtn.querySelector('.btn-title');
        const loaderEl   = targetBtn.querySelector('.loader');

        // UI: loading state
        btnTitleEl.style.display = 'none';
        loaderEl.style.display   = 'block';
        [btnGenerate, btnGeneratePremium, btnGenerateIndo].forEach(b => { if (b) b.disabled = true; });
        resultContainer.style.display  = 'none';
        resultContainer.style.opacity  = '0';
        if (skeletonLoader) skeletonLoader.style.display = 'block';
        if (liveData)       liveData.style.display = 'none';

        const statusMsg = onlyIndo ? 'Searching Indo Premium...' : onlyPremium ? 'Searching Premium...' : 'Fetching Token...';
        updateStatus('loading', statusMsg);

        try {
            const response = await fetch(API_BASE + '/api/db-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'db',
                    query: {
                        table: 'cookies',
                        action: 'select',
                        filters: [{ type: 'eq', column: 'status', value: 'green' }],
                        orders: []
                    }
                })
            });

            const result = await response.json();
            if (!result.data || result.data.length === 0) throw new Error('Tidak ada cookie aktif saat ini.');

            // Country priority (playable in Indonesia)
            const goodCountries = ['ID', 'MY', 'SG', 'US', 'TH', 'PH', 'VN', 'IN', 'KR', 'JP', 'TW', 'HK', 'AU', 'GB', 'CA'];
            const badCountries  = ['TR', 'AR', 'CO', 'PE', 'CL', 'EG', 'NG', 'PK', 'ZA', 'KE'];

            if (!window.usedCookieData) window.usedCookieData = new Set();

            const checkPremium = (data) => /(?:plan|quality)\s*[:=].*(?:premium|ultra hd|4k)/i.test(data || '');

            const shuffled = result.data.sort((a, b) => {
                const aUsed = window.usedCookieData.has(a.cookie_data);
                const bUsed = window.usedCookieData.has(b.cookie_data);
                if (aUsed && !bUsed) return 1;
                if (!aUsed && bUsed) return -1;

                const getScore = (cc) => {
                    const c = (cc || '').toUpperCase();
                    if (goodCountries.includes(c)) return 2;
                    if (badCountries.includes(c))  return 0;
                    return 1;
                };
                const diff = getScore(b.country_code) - getScore(a.country_code);
                return diff !== 0 ? diff : 0.5 - Math.random();
            });

            let targetCookies;
            if (onlyIndo) {
                targetCookies = shuffled.filter(c => (c.country_code || '').toUpperCase() === 'ID' && checkPremium(c.cookie_data));
                if (targetCookies.length === 0) throw new Error('Tidak ada akun premium Indonesia di database saat ini.');
            } else if (onlyPremium) {
                targetCookies = shuffled.filter(c => checkPremium(c.cookie_data));
                if (targetCookies.length === 0) throw new Error('Tidak ada akun premium di database saat ini.');
            } else {
                targetCookies = shuffled.filter(c => !checkPremium(c.cookie_data));
                if (targetCookies.length === 0) targetCookies = shuffled;
            }

            let foundLive = false;
            for (let i = 0; i < targetCookies.length; i++) {
                const cookie = targetCookies[i];
                if (window.usedCookieData.has(cookie.cookie_data)) continue;
                updateStatus('loading', `Checking token ${i + 1}...`);
                const isLive = await parseAndDisplayCookie(cookie.cookie_data, cookie.country_code);
                if (isLive) {
                    window.usedCookieData.add(cookie.cookie_data);
                    foundLive = true;
                    break;
                }
            }

            if (!foundLive) throw new Error('Tidak ada cookie aktif yang valid dari database.');

            updateStatus('ready', 'Token Generated ✓');
            resultContainer.style.display = 'block';
            void resultContainer.offsetHeight; // reflow
            resultContainer.style.opacity = '1';
            if (skeletonLoader) skeletonLoader.style.display = 'none';
            if (liveData) {
                liveData.style.display = 'block';
                liveData.classList.add('fade-in');
            }

        } catch (error) {
            console.error('Error generating token:', error);
            updateStatus('error', 'Generation Failed');
            showToast(error.message || 'Gagal fetch token. Coba lagi.', true);
        } finally {
            isGenerating = false;
            const tBtn   = onlyIndo ? btnGenerateIndo : (onlyPremium ? btnGeneratePremium : btnGenerate);
            const tTitle = tBtn.querySelector('.btn-title');
            const tLoader = tBtn.querySelector('.loader');
            tTitle.style.display  = 'block';
            tLoader.style.display = 'none';
            [btnGenerate, btnGeneratePremium, btnGenerateIndo].forEach(b => { if (b) b.disabled = false; });
        }
    };

    // ============================
    // NETFLIX DEEP LINK TRIGGER
    // ============================
    if (btnTriggerNetflix) {
        btnTriggerNetflix.addEventListener('click', () => {
            const link = tokenLink.value;
            if (!link) return;
            const device = detectDevice();
            if (device === 'android' || device === 'ios') {
                window.location.href = link;
            } else if (device === 'tv') {
                window.location.href = 'https://www.netflix.com/tv8';
            } else {
                window.open(link, '_blank');
                showToast('Membuka di tab baru...');
            }
        });
    }

    // ============================
    // COPY BUTTONS
    // ============================
    function copyToClipboard(text, msg) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(msg);
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast(msg);
        });
    }

    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            if (!tokenLink.value) return;
            copyToClipboard(tokenLink.value, 'Auto-Login Link disalin! ✓');
        });
    }

    if (btnCopyCookie) {
        btnCopyCookie.addEventListener('click', () => {
            if (!tokenData.value) return;
            copyToClipboard(tokenData.value, 'Raw Cookie disalin! ✓');
        });
    }

    // ============================
    // PAYMENT CONFIG
    // ============================
    let paymentConfig = { amount: 3000, indoAmount: 10000 };
    fetch(API_BASE + '/api/payment-config').then(r => r.json()).then(data => {
        if (data && data.amount) paymentConfig = data;
    }).catch(() => {});

    let currentPremiumType = 'regular';

    // ============================
    // PAYMENT MODAL REFS
    // ============================
    const paymentModal         = document.getElementById('payment-modal');
    const paymentDetail        = document.getElementById('payment-detail');
    const paymentQris          = document.getElementById('payment-qris');
    const detailOriginalPrice  = document.getElementById('detail-original-price');
    const detailDiscountRow    = document.getElementById('detail-discount-row');
    const detailDiscountAmount = document.getElementById('detail-discount-amount');
    const detailPromoBadge     = document.getElementById('detail-promo-badge');
    const detailPromoText      = document.getElementById('detail-promo-text');
    const detailTotalPrice     = document.getElementById('detail-total-price');
    const btnProceedPayment    = document.getElementById('btn-proceed-payment');
    const proceedText          = document.getElementById('proceed-text');
    const proceedLoader        = document.getElementById('proceed-loader');
    const qrisImage            = document.getElementById('qris-image');
    const qrisLoader           = document.getElementById('qris-loader');
    const qrisContainer        = document.getElementById('qris-container');
    const qrisAmountContainer  = document.getElementById('qris-amount-container');
    const qrisAmountText       = document.getElementById('qris-amount-text');
    const btnCheckPayment      = document.getElementById('btn-check-payment');
    const checkLoader          = document.getElementById('check-loader');
    const checkText            = document.getElementById('check-text');
    const btnBackDetail        = document.getElementById('btn-back-detail');
    const btnCancelPayment     = document.getElementById('btn-cancel-payment');
    const promoCodeInput       = document.getElementById('promo-code-input');
    const btnApplyPromo        = document.getElementById('btn-apply-promo');
    const modalTitle           = document.getElementById('modal-title');
    const modalIndoBadge       = document.getElementById('modal-indo-badge');
    const modalDesc            = document.getElementById('payment-desc');
    const detailItemName       = document.getElementById('detail-item-name');

    let paymentPollingInterval = null;
    let currentOrderId = null;
    let appliedPromoDiscount = 0;
    let appliedPromo = null;

    function resetPromoState() {
        if (promoCodeInput) promoCodeInput.value = '';
        if (btnApplyPromo) {
            btnApplyPromo.textContent = 'Apply';
            btnApplyPromo.disabled = false;
            btnApplyPromo.style.cssText = '';
        }
        appliedPromo = null;
        appliedPromoDiscount = 0;
    }

    function startPaymentFlow(type = 'regular') {
        if (isGenerating) return;
        currentPremiumType = type;
        currentOrderId = null;
        resetPromoState();
        if (paymentPollingInterval) clearInterval(paymentPollingInterval);

        paymentDetail.style.display = 'block';
        paymentQris.style.display   = 'none';
        if (qrisContainer) qrisContainer.classList.remove('loaded');
        if (btnCheckPayment) btnCheckPayment.style.display = 'none';

        const isIndo = type === 'indo';
        const fullAmount = isIndo ? (paymentConfig.indoAmount || 10000) : (paymentConfig.amount || 3000);

        if (modalTitle) modalTitle.textContent = isIndo ? 'Premium Indo' : 'Premium Access';
        if (modalIndoBadge) modalIndoBadge.style.display = isIndo ? 'inline-block' : 'none';
        if (modalDesc) modalDesc.textContent = isIndo
            ? 'Dapatkan token Netflix region Indonesia. Anti-geoblock & stabil.'
            : 'Lengkapi detail pembayaran kamu di bawah ini.';
        if (detailItemName) detailItemName.textContent = isIndo ? 'Premium Indo Token 🇮🇩' : 'Premium Token';

        if (detailOriginalPrice) detailOriginalPrice.textContent = 'Rp ' + fullAmount.toLocaleString('id-ID');
        if (detailDiscountRow) detailDiscountRow.style.display = 'none';
        if (detailPromoBadge) detailPromoBadge.style.display = 'none';
        if (detailTotalPrice) {
            detailTotalPrice.textContent = 'Rp ' + fullAmount.toLocaleString('id-ID');
            detailTotalPrice.style.color = '';
        }
        if (proceedText) proceedText.textContent = 'Lanjut Pembayaran';
        if (proceedLoader) proceedLoader.style.display = 'none';
        if (btnProceedPayment) {
            btnProceedPayment.disabled = false;
            btnProceedPayment.onclick = null;
        }

        paymentModal.classList.add('show');
    }

    // Proceed to QRIS
    if (btnProceedPayment) {
        btnProceedPayment.addEventListener('click', async () => {
            if (btnProceedPayment.disabled) return;
            const isIndo = currentPremiumType === 'indo';
            const fullAmount = isIndo ? (paymentConfig.indoAmount || 10000) : (paymentConfig.amount || 3000);
            const amount = appliedPromoDiscount > 0 ? Math.round(fullAmount * (100 - appliedPromoDiscount) / 100) : fullAmount;

            const orderId = 'ORD-RAIKHS-' + Date.now() + Math.floor(Math.random() * 1000);
            currentOrderId = orderId;

            btnProceedPayment.disabled = true;
            if (proceedText) proceedText.textContent = 'Menyiapkan QRIS...';
            if (proceedLoader) proceedLoader.style.display = 'inline-block';

            try {
                const qrisRes = await fetch(API_BASE + '/api/create-qris', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, amount })
                });
                const qrisData = await qrisRes.json();

                if (qrisData.qris_string) {
                    paymentDetail.style.display = 'none';
                    paymentQris.style.display   = 'block';
                    if (qrisContainer) qrisContainer.classList.remove('loaded');

                    // Prioritaskan foto QRIS yang diupload admin.
                    // Jika URL relatif (/uploads/...), tambahkan API_BASE (Railway URL)
                    // Fallback ke generate QR dinamis hanya jika belum ada foto.
                    const rawQrisImage = qrisData.qris_image;
                    const resolvedQrisImage = rawQrisImage
                        ? (rawQrisImage.startsWith('http') ? rawQrisImage : API_BASE + rawQrisImage)
                        : null;
                    const qrUrl = resolvedQrisImage
                        ? resolvedQrisImage
                        : `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=7c3aed&bgcolor=ffffff&data=${encodeURIComponent(qrisData.qris_string)}`;

                    if (qrisLoader) qrisLoader.style.display = 'flex';
                    if (qrisImage) qrisImage.style.display = 'none';
                    if (qrisAmountContainer) qrisAmountContainer.style.display = 'none';
                    if (btnCheckPayment) {
                        btnCheckPayment.style.display = 'none';
                        btnCheckPayment.disabled = false;
                    }
                    if (checkText) checkText.textContent = 'Saya Sudah Bayar ✓';
                    if (checkLoader) checkLoader.style.display = 'none';

                    if (qrisImage) {
                        qrisImage.onload = () => {
                            if (qrisLoader) qrisLoader.style.display = 'none';
                            qrisImage.style.display = 'block';
                            if (qrisContainer) qrisContainer.classList.add('loaded');
                            if (qrisAmountContainer) qrisAmountContainer.style.display = 'block';
                            if (btnCheckPayment) btnCheckPayment.style.display = 'flex';
                            if (qrisAmountText) qrisAmountText.textContent = 'Rp ' + (qrisData.total_payment || amount).toLocaleString('id-ID');
                        };
                        qrisImage.onerror = () => {
                            // Jika foto gagal load, fallback ke QR generated
                            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&color=7c3aed&bgcolor=ffffff&data=${encodeURIComponent(qrisData.qris_string)}`;
                            qrisImage.src = fallbackUrl;
                        };
                        qrisImage.src = qrUrl;
                    }

                    // Polling
                    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
                    paymentPollingInterval = setInterval(async () => {
                        try {
                            const res  = await fetch(API_BASE + `/api/check-payment?order_id=${currentOrderId}`);
                            const data = await res.json();
                            if (data.status === 'completed') {
                                clearInterval(paymentPollingInterval);
                                paymentModal.classList.remove('show');
                                showToast('Pembayaran berhasil! ✓');
                                const _isIndo = currentPremiumType === 'indo';
                                generateAction(!_isIndo, _isIndo);
                            }
                        } catch (e) { console.error('Polling error', e); }
                    }, 3000);
                } else {
                    showToast('Gagal generate QRIS, coba lagi.', true);
                    btnProceedPayment.disabled = false;
                    if (proceedText) proceedText.textContent = 'Lanjut Pembayaran';
                    if (proceedLoader) proceedLoader.style.display = 'none';
                }
            } catch (err) {
                showToast('Error: ' + err.message, true);
                btnProceedPayment.disabled = false;
                if (proceedText) proceedText.textContent = 'Lanjut Pembayaran';
                if (proceedLoader) proceedLoader.style.display = 'none';
            }
        });
    }

    // Back to detail
    if (btnBackDetail) {
        btnBackDetail.addEventListener('click', () => {
            if (paymentPollingInterval) clearInterval(paymentPollingInterval);
            paymentQris.style.display   = 'none';
            paymentDetail.style.display = 'block';
        });
    }

    // Cancel
    if (btnCancelPayment) {
        btnCancelPayment.addEventListener('click', () => {
            if (paymentPollingInterval) clearInterval(paymentPollingInterval);
            paymentModal.classList.remove('show');
        });
    }

    // Close X
    const btnClosePaymentX = document.getElementById('btn-close-payment-x');
    if (btnClosePaymentX) {
        btnClosePaymentX.addEventListener('click', () => {
            if (paymentPollingInterval) clearInterval(paymentPollingInterval);
            paymentModal.classList.remove('show');
        });
    }

    // Manual payment check
    if (btnCheckPayment) {
        btnCheckPayment.addEventListener('click', async () => {
            if (!currentOrderId) return;
            btnCheckPayment.disabled = true;
            if (checkText) checkText.textContent = 'Mengecek...';
            if (checkLoader) checkLoader.style.display = 'inline-block';

            try {
                const res  = await fetch(API_BASE + `/api/check-payment?order_id=${currentOrderId}`);
                const data = await res.json();
                if (data.status === 'completed') {
                    if (checkText) checkText.textContent = 'Berhasil! ✓';
                    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
                    const _isIndo = currentPremiumType === 'indo';
                    setTimeout(() => {
                        paymentModal.classList.remove('show');
                        showToast('Pembayaran dikonfirmasi! ✓');
                        generateAction(!_isIndo, _isIndo);
                    }, 900);
                } else {
                    setTimeout(() => {
                        if (checkText) checkText.textContent = 'Belum Ditemukan. Cek Lagi?';
                        if (checkLoader) checkLoader.style.display = 'none';
                        btnCheckPayment.disabled = false;
                    }, 1500);
                }
            } catch {
                setTimeout(() => {
                    if (checkText) checkText.textContent = 'Gagal Cek (Error)';
                    if (checkLoader) checkLoader.style.display = 'none';
                    btnCheckPayment.disabled = false;
                }, 1500);
            }
        });
    }

    // ============================
    // PROMO CODE
    // ============================
    if (btnApplyPromo) {
        btnApplyPromo.addEventListener('click', async () => {
            const code = promoCodeInput.value.trim().toUpperCase();
            if (!code) return;

            btnApplyPromo.textContent = '...';
            btnApplyPromo.disabled = true;

            try {
                const res  = await fetch(API_BASE + '/api/check-promo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, type: currentPremiumType })
                });
                const data = await res.json();

                if (data.valid) {
                    appliedPromo = code;
                    const isIndo = currentPremiumType === 'indo';
                    const fullAmount = isIndo ? (paymentConfig.indoAmount || 10000) : (paymentConfig.amount || 3000);
                    const maxCap = data.maxDiscount || 0;

                    let rawDiscAmt = data.type === 'fixed'
                        ? data.discount
                        : Math.round(fullAmount * data.discount / 100);
                    const actualDiscount = maxCap > 0 ? Math.min(rawDiscAmt, maxCap) : rawDiscAmt;
                    const discounted = Math.max(0, fullAmount - actualDiscount);

                    if (discounted <= 0) {
                        // FREE
                        btnApplyPromo.textContent = 'FREE! 🎉';
                        if (detailDiscountRow) detailDiscountRow.style.display = 'flex';
                        if (detailDiscountAmount) detailDiscountAmount.textContent = '-Rp ' + fullAmount.toLocaleString('id-ID');
                        if (detailPromoBadge) detailPromoBadge.style.display = 'block';
                        if (detailPromoText) detailPromoText.innerHTML = code + ' - GRATIS <span style="color:#ef4444;font-weight:bold;">✕</span>';
                        if (detailTotalPrice) { detailTotalPrice.textContent = 'Rp 0'; detailTotalPrice.style.color = '#f59e0b'; }
                        if (proceedText) proceedText.textContent = 'Dapatkan Gratis 🎉';
                        appliedPromoDiscount = 100;

                        if (detailPromoBadge) detailPromoBadge.onclick = removePromo;
                        if (btnProceedPayment) {
                            btnProceedPayment.onclick = () => {
                                paymentModal.classList.remove('show');
                                const _isIndo = currentPremiumType === 'indo';
                                generateAction(!_isIndo, _isIndo);
                            };
                        }
                        showToast('Promo aktif! Gratis 🎉');
                    } else {
                        // PARTIAL DISCOUNT
                        const pct = Math.round(actualDiscount / fullAmount * 100);
                        appliedPromoDiscount = pct;
                        btnApplyPromo.textContent = pct + '% ✓';
                        if (detailDiscountRow) detailDiscountRow.style.display = 'flex';
                        if (detailDiscountAmount) detailDiscountAmount.textContent = '-Rp ' + actualDiscount.toLocaleString('id-ID');
                        if (detailPromoBadge) detailPromoBadge.style.display = 'block';
                        if (detailPromoText) detailPromoText.innerHTML = code + ' <span style="color:#ef4444;font-weight:bold;">✕</span>';
                        if (detailTotalPrice) detailTotalPrice.textContent = 'Rp ' + discounted.toLocaleString('id-ID');
                        if (detailPromoBadge) detailPromoBadge.onclick = removePromo;
                        if (btnProceedPayment) btnProceedPayment.onclick = null;
                        showToast('Diskon Rp' + actualDiscount.toLocaleString('id-ID') + ' applied! ✓');
                    }
                } else {
                    btnApplyPromo.textContent = 'Invalid ✕';
                    btnApplyPromo.style.background = 'rgba(239,68,68,0.1)';
                    btnApplyPromo.style.color = '#ef4444';
                    setTimeout(() => {
                        btnApplyPromo.textContent = 'Apply';
                        btnApplyPromo.disabled = false;
                        btnApplyPromo.style.cssText = '';
                    }, 2000);
                }
            } catch {
                btnApplyPromo.textContent = 'Error';
                setTimeout(() => { btnApplyPromo.textContent = 'Apply'; btnApplyPromo.disabled = false; }, 2000);
            }
        });
    }

    function removePromo() {
        appliedPromo = null;
        appliedPromoDiscount = 0;
        if (promoCodeInput) promoCodeInput.value = '';
        if (btnApplyPromo) { btnApplyPromo.textContent = 'Apply'; btnApplyPromo.disabled = false; btnApplyPromo.style.cssText = ''; }
        if (detailDiscountRow) detailDiscountRow.style.display = 'none';
        if (detailPromoBadge) { detailPromoBadge.style.display = 'none'; detailPromoBadge.onclick = null; }
        const orig = currentPremiumType === 'indo' ? (paymentConfig.indoAmount || 10000) : (paymentConfig.amount || 3000);
        if (detailTotalPrice) { detailTotalPrice.textContent = 'Rp ' + orig.toLocaleString('id-ID'); detailTotalPrice.style.color = ''; }
        if (btnProceedPayment) btnProceedPayment.onclick = null;
        if (proceedText) proceedText.textContent = 'Lanjut Pembayaran';
        showToast('Promo dihapus.');
    }

    // ============================
    // BUTTON EVENT LISTENERS
    // ============================
    if (btnGenerate)       btnGenerate.addEventListener('click', () => generateAction(false, false));
    if (btnGeneratePremium) btnGeneratePremium.addEventListener('click', () => startPaymentFlow('regular'));
    if (btnGenerateIndo)   btnGenerateIndo.addEventListener('click', () => startPaymentFlow('indo'));

    // ============================
    // INFO MODAL
    // ============================
    const infoModal      = document.getElementById('info-modal');
    const btnCloseInfoX  = document.getElementById('btn-close-info-x');
    const btnUnderstand  = document.getElementById('btn-understand-info');
    const btnOpenInfo    = document.getElementById('btn-open-info');

    const closeInfoModal = () => {
        if (infoModal) infoModal.classList.remove('show');
        localStorage.setItem('raikhsapedia_info_seen', 'true');
    };

    const openInfoModal = () => {
        if (infoModal) infoModal.classList.add('show');
    };

    if (!localStorage.getItem('raikhsapedia_info_seen')) {
        setTimeout(openInfoModal, 700);
    }

    if (btnCloseInfoX)  btnCloseInfoX.addEventListener('click', closeInfoModal);
    if (btnUnderstand)  btnUnderstand.addEventListener('click', closeInfoModal);
    if (btnOpenInfo)    btnOpenInfo.addEventListener('click', openInfoModal);

    // Close modals on overlay click
    if (infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) closeInfoModal();
        });
    }

    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                if (paymentPollingInterval) clearInterval(paymentPollingInterval);
                paymentModal.classList.remove('show');
            }
        });
    }

    // ============================
    // KEYBOARD SHORTCUT
    // ============================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (infoModal && infoModal.classList.contains('show')) closeInfoModal();
            if (paymentModal && paymentModal.classList.contains('show')) {
                if (paymentPollingInterval) clearInterval(paymentPollingInterval);
                paymentModal.classList.remove('show');
            }
        }
        // Spacebar / Enter on main card = generate random
        if ((e.key === ' ' || e.key === 'Enter') && e.target === document.body) {
            e.preventDefault();
            if (!isGenerating && !paymentModal.classList.contains('show')) {
                generateAction(false, false);
            }
        }
    });

    console.log('%cRaikhsapedia', 'color:#a78bfa;font-size:24px;font-weight:800;');
    console.log('%cNetflix Token Generator | Loaded ✓', 'color:#06b6d4;font-size:12px;');

}); // END DOMContentLoaded
