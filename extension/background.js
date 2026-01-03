let pendingVerificationFromDashboard = false;

chrome.runtime.onInstalled.addListener(() => {
    console.log("[Deeproof] Extension installed/updated");
});

chrome.runtime.onStartup.addListener(() => {
    console.log("[Deeproof] Browser started, service worker initialized");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action } = request;

    console.log("[Deeproof] Background received message:", action);

    switch (action) {
        case "get_stored_proof":
            chrome.storage.local.get('deeproofProof', (result) => {
                sendResponse({ proof: result.deeproofProof || null });
            });
            return true;

        case "GENERATE_PROOF_FOR_DASHBOARD":
            chrome.storage.local.get('deeproofProof', async (result) => {
                if (result.deeproofProof?.isVerified) {
                    sendResponse({
                        success: true,
                        proof: result.deeproofProof.proof,
                        solidityParams: result.deeproofProof.solidityParams,
                        commitment: result.deeproofProof.commitment,
                        timestamp: result.deeproofProof.timestamp,
                        cached: true
                    });
                } else {
                    sendResponse({
                        success: false,
                        error: "NO_PROOF",
                        message: "Please verify via extension popup first. Open Binance.com and click the extension icon."
                    });
                }
            });
            return true;

        case "PROOF_GENERATED":
            chrome.tabs.query({ url: ["http://localhost:3000/*", "http://127.0.0.1:3000/*", "https://deeproof.vercel.app/*", "https://*.vercel.app/*"] }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "PROOF_UPDATE",
                        payload: request.proof
                    }).catch(() => { });
                });
            });
            sendResponse({ success: true });
            return true;

        case "OPEN_BINANCE_FOR_VERIFICATION":
            pendingVerificationFromDashboard = true;
            chrome.tabs.create({ url: "https://www.binance.com/en/my/dashboard" }, (tab) => {
                chrome.storage.local.set({ pendingBinanceTabId: tab.id });
            });
            sendResponse({ success: true });
            return true;

        case "PING":
            sendResponse({ status: "alive" });
            return true;

        default:
            sendResponse({ error: "Unknown action" });
            return true;
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('binance.com')) {
        chrome.storage.local.get('pendingBinanceTabId', (result) => {
            if (result.pendingBinanceTabId === tabId || pendingVerificationFromDashboard) {
                chrome.tabs.sendMessage(tabId, {
                    action: "SHOW_VERIFICATION_PROMPT"
                }).catch(() => { });

                pendingVerificationFromDashboard = false;
                chrome.storage.local.remove('pendingBinanceTabId');
            }
        });
    }
});

console.log("[Deeproof] Service Worker initialized");