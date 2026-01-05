let pendingVerificationFromDashboard = false;

const PROOF_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes

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
                const proof = result.deeproofProof || null;

                // Validate proof expiry
                if (proof && proof.expiresAt) {
                    if (Date.now() > proof.expiresAt) {
                        console.log("[Deeproof] Stored proof expired, clearing...");
                        chrome.storage.local.remove('deeproofProof');
                        sendResponse({ proof: null, expired: true });
                        return;
                    }
                }

                sendResponse({ proof });
            });
            return true;

        case "GENERATE_PROOF_FOR_DASHBOARD":
            chrome.storage.local.get('deeproofProof', async (result) => {
                const proof = result.deeproofProof;

                if (!proof || !proof.isVerified) {
                    sendResponse({
                        success: false,
                        error: "NO_PROOF",
                        message: "Please verify via extension popup first. Open Binance.com and click the extension icon."
                    });
                    return;
                }

                // Validate proof expiry
                if (proof.expiresAt && Date.now() > proof.expiresAt) {
                    console.log("[Deeproof] Proof expired");
                    chrome.storage.local.remove('deeproofProof');
                    sendResponse({
                        success: false,
                        error: "PROOF_EXPIRED",
                        message: "Proof expired. Please re-verify on Binance."
                    });
                    return;
                }

                // Validate wallet binding if present
                if (request.walletAddress && proof.walletAddress) {
                    if (proof.walletAddress.toLowerCase() !== request.walletAddress.toLowerCase()) {
                        sendResponse({
                            success: false,
                            error: "WALLET_MISMATCH",
                            message: "Proof was generated for a different wallet address."
                        });
                        return;
                    }
                }

                sendResponse({
                    success: true,
                    proof: proof.proof,
                    solidityParams: proof.solidityParams,
                    commitment: proof.commitment,
                    timestamp: proof.timestamp,
                    walletAddress: proof.walletAddress,
                    provider: proof.provider || "binance",
                    cached: true
                });
            });
            return true;

        case "PROOF_GENERATED":
            // When new proof is generated, add expiry timestamp
            const proofData = request.proof;
            const timestamp = Date.now();
            const expiresAt = timestamp + PROOF_VALIDITY_MS;

            const enhancedProof = {
                ...proofData,
                timestamp,
                expiresAt,
                walletAddress: request.walletAddress || proofData.walletAddress,
                provider: request.provider || proofData.provider || "binance"
            };

            chrome.storage.local.set({ deeproofProof: enhancedProof }, () => {
                console.log("[Deeproof] Proof stored with expiry:", new Date(expiresAt));
            });

            chrome.tabs.query({ url: ["http://localhost:3000/*", "http://127.0.0.1:3000/*", "https://deeproof.vercel.app/*", "https://*.vercel.app/*"] }, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "PROOF_UPDATE",
                        payload: enhancedProof
                    }).catch(() => { });
                });
            });
            sendResponse({ success: true });
            return true;

        case "CLEAR_PROOF":
            chrome.storage.local.remove('deeproofProof', () => {
                console.log("[Deeproof] Proof cleared");
                sendResponse({ success: true });
            });
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