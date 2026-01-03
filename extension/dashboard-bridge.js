const EXTENSION_ID = "deeproof-verifier";
async function wakeUpServiceWorker() {
    try {
        await chrome.runtime.sendMessage({ action: "PING" });
        return true;
    } catch {
        return false;
    }
}

async function sendMessageToBackground(message, maxRetries = 3) {
    await wakeUpServiceWorker();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (!chrome.runtime?.id) {
                throw new Error("Extension context invalidated");
            }

            const response = await chrome.runtime.sendMessage(message);

            if (chrome.runtime.lastError) {
                throw new Error(chrome.runtime.lastError.message);
            }

            return response;
        } catch (error) {
            console.warn(`[Deeproof] Message attempt ${attempt}/${maxRetries} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            await new Promise(resolve => setTimeout(resolve, 200 * attempt));
            await wakeUpServiceWorker();
        }
    }
}

setTimeout(() => {
    window.postMessage({ type: "DEEPROOF_EXTENSION_READY", source: EXTENSION_ID }, "*");
}, 100);

window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    const { type, payload } = event.data || {};

    switch (type) {
        case "DEEPROOF_CHECK_EXTENSION":
            window.postMessage({
                type: "DEEPROOF_EXTENSION_STATUS",
                source: EXTENSION_ID,
                payload: { installed: true, version: "1.0" }
            }, "*");
            break;

        case "DEEPROOF_REQUEST_PROOF":
            try {
                const response = await sendMessageToBackground({
                    action: "GENERATE_PROOF_FOR_DASHBOARD",
                    platform: payload?.platform || "binance"
                });

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
            try {
                await sendMessageToBackground({
                    action: "OPEN_BINANCE_FOR_VERIFICATION"
                });
            } catch (error) {
                console.error("[Deeproof] Failed to open Binance:", error);
            }
            break;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PROOF_UPDATE") {
        window.postMessage({
            type: "DEEPROOF_PROOF_UPDATE",
            source: EXTENSION_ID,
            payload: request.payload
        }, "*");
        sendResponse({ success: true });
    }
    return true;
});

console.log("[Deeproof] Dashboard bridge initialized");
