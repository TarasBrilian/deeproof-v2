// Deeproof Extension - Background Service Worker
// Handles communication between dashboard, popup, and content scripts

// Track if user came from dashboard to auto-open popup
let pendingVerificationFromDashboard = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action } = request;

    switch (action) {
        case "get_stored_proof":
            chrome.storage.local.get('deeproofProof', (result) => {
                sendResponse({ proof: result.deeproofProof || null });
            });
            return true;

        case "GENERATE_PROOF_FOR_DASHBOARD":
            // Check if we have a stored proof first
            chrome.storage.local.get('deeproofProof', async (result) => {
                if (result.deeproofProof?.isVerified) {
                    // Return existing proof
                    sendResponse({
                        success: true,
                        proof: result.deeproofProof.proof,
                        solidityParams: result.deeproofProof.solidityParams,
                        commitment: result.deeproofProof.commitment,
                        timestamp: result.deeproofProof.timestamp,
                        cached: true
                    });
                } else {
                    // No proof stored - tell dashboard to prompt user
                    sendResponse({
                        success: false,
                        error: "NO_PROOF",
                        message: "Please verify via extension popup first. Open Binance.com and click the extension icon."
                    });
                }
            });
            return true;

        case "PROOF_GENERATED":
            // Notify any listening dashboard tabs about new proof
            chrome.tabs.query({ url: ["http://localhost:3000/*", "http://127.0.0.1:3000/*"] }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "PROOF_UPDATE",
                        payload: request.proof
                    }).catch(() => { }); // Ignore errors for tabs without listener
                });
            });
            sendResponse({ success: true });
            return true;

        case "OPEN_BINANCE_FOR_VERIFICATION":
            // Dashboard requested to open Binance and trigger verification
            pendingVerificationFromDashboard = true;
            chrome.tabs.create({ url: "https://www.binance.com/en/my/dashboard" }, (tab) => {
                // Store the tab ID to track it
                chrome.storage.local.set({ pendingBinanceTabId: tab.id });
            });
            sendResponse({ success: true });
            return true;
    }

    return false;
});

// Listen for tab updates to auto-open popup when user lands on Binance
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url?.includes('binance.com')) {
        chrome.storage.local.get('pendingBinanceTabId', (result) => {
            if (result.pendingBinanceTabId === tabId || pendingVerificationFromDashboard) {
                // User landed on Binance from dashboard flow - open popup
                // Note: Chrome doesn't allow programmatic popup opening, 
                // but we can inject a notification to prompt the user
                chrome.tabs.sendMessage(tabId, {
                    action: "SHOW_VERIFICATION_PROMPT"
                }).catch(() => { });

                // Reset tracking
                pendingVerificationFromDashboard = false;
                chrome.storage.local.remove('pendingBinanceTabId');
            }
        });
    }
});

console.log("Deeproof Service Worker initialized");