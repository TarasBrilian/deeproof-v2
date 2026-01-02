// Dashboard Bridge - Content script for frontend-extension communication
// Injected into localhost:3000 (frontend dashboard)

const EXTENSION_ID = "deeproof-verifier";

// Notify dashboard that extension is available
window.postMessage({ type: "DEEPROOF_EXTENSION_READY", source: EXTENSION_ID }, "*");

// Listen for messages from dashboard
window.addEventListener("message", async (event) => {
    // Only accept messages from same window
    if (event.source !== window) return;

    const { type, payload } = event.data || {};

    switch (type) {
        case "DEEPROOF_CHECK_EXTENSION":
            // Dashboard is checking if extension exists
            window.postMessage({
                type: "DEEPROOF_EXTENSION_STATUS",
                source: EXTENSION_ID,
                payload: { installed: true, version: "1.0" }
            }, "*");
            break;

        case "DEEPROOF_REQUEST_PROOF":
            // Dashboard requesting proof generation
            try {
                // Forward to background script
                const response = await chrome.runtime.sendMessage({
                    action: "GENERATE_PROOF_FOR_DASHBOARD",
                    platform: payload?.platform || "binance"
                });

                // Send result back to dashboard
                window.postMessage({
                    type: "DEEPROOF_PROOF_RESULT",
                    source: EXTENSION_ID,
                    payload: response
                }, "*");
            } catch (error) {
                window.postMessage({
                    type: "DEEPROOF_PROOF_ERROR",
                    source: EXTENSION_ID,
                    payload: { error: error.message }
                }, "*");
            }
            break;

        case "DEEPROOF_GET_STORED_PROOF":
            // Dashboard requesting stored proof
            try {
                const result = await chrome.storage.local.get("deeproofProof");
                window.postMessage({
                    type: "DEEPROOF_STORED_PROOF",
                    source: EXTENSION_ID,
                    payload: result.deeproofProof || null
                }, "*");
            } catch (error) {
                window.postMessage({
                    type: "DEEPROOF_PROOF_ERROR",
                    source: EXTENSION_ID,
                    payload: { error: error.message }
                }, "*");
            }
            break;

        case "DEEPROOF_OPEN_BINANCE":
            // Dashboard requesting to open Binance and trigger verification
            try {
                await chrome.runtime.sendMessage({
                    action: "OPEN_BINANCE_FOR_VERIFICATION"
                });
            } catch (error) {
                console.error("Failed to open Binance:", error);
            }
            break;
    }
});

// Listen for proof updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PROOF_UPDATE") {
        // Forward proof update to dashboard
        window.postMessage({
            type: "DEEPROOF_PROOF_UPDATE",
            source: EXTENSION_ID,
            payload: request.payload
        }, "*");
        sendResponse({ success: true });
    }
});

console.log("[Deeproof] Dashboard bridge initialized");

