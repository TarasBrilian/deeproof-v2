const TARGET_URL = 'bapi/accounts/v1/private/account/get-user-base-info';

let capturedUserData = null;
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._deeproofUrl = url;
    return originalOpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function (...args) {
    if (this._deeproofUrl && this._deeproofUrl.includes(TARGET_URL)) {
        this.addEventListener('load', function () {
            try {
                const json = JSON.parse(this.responseText);
                if (json.code === "000000" && json.data) {
                    capturedUserData = {
                        userId: json.data.userId,
                        email: json.data.email,
                        level: json.data.level
                    };
                    console.log('Deeproof: Captured user data from API response', capturedUserData);
                }
            } catch (e) {
                console.error('Deeproof: Failed to parse response', e);
            }
        });
    }
    return originalSend.apply(this, args);
};

const originalFetch = window.fetch;
window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    const url = args[0]?.url || args[0];
    if (typeof url === 'string' && url.includes(TARGET_URL)) {
        try {
            const cloned = response.clone();
            const json = await cloned.json();
            if (json.code === "000000" && json.data) {
                capturedUserData = {
                    userId: json.data.userId,
                    email: json.data.email,
                    level: json.data.level
                };
                console.log('Deeproof: Captured user data from fetch response', capturedUserData);
            }
        } catch (e) {
            console.error('Deeproof: Failed to parse fetch response', e);
        }
    }

    return response;
};

window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type !== 'DEEPROOF_GET_DATA') return;

    console.log('Deeproof: Data request received, captured data:', capturedUserData);

    if (capturedUserData) {
        window.postMessage({
            type: 'DEEPROOF_DATA_RESPONSE',
            success: true,
            data: capturedUserData
        }, '*');
    } else {
        window.postMessage({
            type: 'DEEPROOF_DATA_RESPONSE',
            success: false,
            error: 'No data captured. Please refresh the Binance page to load your profile data.'
        }, '*');
    }
});

console.log('Deeproof: Network interceptor loaded (passive mode)');
