// Content script - bridge between popup and MAIN world
// Runs in ISOLATED world

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_binance_data") {
        console.log('Deeproof: Requesting captured data from MAIN world');

        // Request captured data from MAIN world (no new API calls)
        window.postMessage({ type: 'DEEPROOF_GET_DATA' }, '*');

        // Wait for response
        const handler = (event) => {
            if (event.source !== window) return;
            if (event.data.type !== 'DEEPROOF_DATA_RESPONSE') return;

            console.log('Deeproof: Got response', event.data);
            window.removeEventListener('message', handler);
            sendResponse(event.data);
        };

        window.addEventListener('message', handler);

        // Timeout after 5 seconds
        setTimeout(() => {
            window.removeEventListener('message', handler);
            sendResponse({
                success: false,
                error: 'No data available. Refresh the Binance page first.'
            });
        }, 5000);

        return true; // Keep channel open
    }

    if (request.action === "SHOW_VERIFICATION_PROMPT") {
        // Show floating notification prompting user to click extension
        showVerificationPrompt();
        sendResponse({ success: true });
    }
});

// Create and show verification prompt UI
function showVerificationPrompt() {
    // Remove existing prompt if any
    const existing = document.getElementById('deeproof-verification-prompt');
    if (existing) existing.remove();

    const prompt = document.createElement('div');
    prompt.id = 'deeproof-verification-prompt';
    prompt.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(135deg, #0a0a0f 0%, #151520 100%);
            border: 1px solid #00F0FF;
            border-radius: 12px;
            padding: 20px;
            max-width: 320px;
            box-shadow: 0 4px 30px rgba(0, 240, 255, 0.3);
            font-family: 'Segoe UI', system-ui, sans-serif;
            animation: slideIn 0.3s ease;
        ">
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <div style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #00F0FF, #0080FF);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: #000;
                ">D</div>
                <span style="
                    font-size: 16px;
                    font-weight: 600;
                    background: linear-gradient(90deg, #00F0FF, #00FF88);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                ">Deeproof Verifier</span>
            </div>
            <p style="color: #fff; font-size: 14px; margin-bottom: 16px;">
                Click the extension icon in your browser toolbar to verify your Binance KYC.
            </p>
            <div style="display: flex; align-items: center; gap: 8px; color: #00F0FF; font-size: 13px; animation: pulse 1.5s infinite;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                <span>Look for the D icon in toolbar</span>
            </div>
            <button id="deeproof-dismiss" style="
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                color: #666;
                cursor: pointer;
                font-size: 18px;
            ">×</button>
        </div>
    `;

    document.body.appendChild(prompt);

    // Dismiss button
    document.getElementById('deeproof-dismiss').addEventListener('click', () => {
        prompt.remove();
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        if (document.getElementById('deeproof-verification-prompt')) {
            prompt.remove();
        }
    }, 15000);
}

console.log("Deeproof: Content script loaded");

