document.addEventListener('DOMContentLoaded', () => {
    const verifyBtn = document.getElementById('verifyBtn');
    const statusEl = document.getElementById('status');
    const statusIcon = document.getElementById('statusIcon');

    checkExistingProof();

    verifyBtn.addEventListener('click', () => {
        runVerification();
    });

    async function checkExistingProof() {
        const result = await chrome.storage.local.get('deeproofProof');
        if (result.deeproofProof?.isVerified) {
            updateUI('verified', 'Verified');
            verifyBtn.textContent = 'Re-verify';
        }
    }

    async function runVerification() {
        updateUI('processing', 'Looking for Binance tab...');
        verifyBtn.disabled = true;

        try {
            const tabs = await chrome.tabs.query({ url: "https://www.binance.com/*" });

            if (tabs.length === 0) {
                throw new Error("Open binance.com first and make sure you're logged in");
            }

            const binanceTab = tabs[0];

            updateUI('processing', 'Getting user data...');

            const response = await chrome.tabs.sendMessage(binanceTab.id, {
                action: "fetch_binance_data"
            });

            if (!response || !response.success) {
                throw new Error(response?.error || "No data captured. Refresh Binance page and try again.");
            }

            const { userId, level } = response.data;

            if (level < 2) {
                updateUI('error', 'KYC Level is not 2');
                verifyBtn.disabled = false;
                return;
            }

            updateUI('processing', 'Generating ZK Proof...');
            console.log(`User Valid (ID: ${userId}). Generating ZK proof...`);

            const trapdoor = generateSecureRandom();
            const circuitInput = {
                userId: userId.toString(),
                trapdoor: trapdoor,
                minKycLevel: "2",
                userKycLevel: level.toString()
            };

            console.log("Circuit input:", circuitInput);

            const wasmPath = chrome.runtime.getURL("identity.wasm");
            const zkeyPath = chrome.runtime.getURL("identity_final.zkey");

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInput,
                wasmPath,
                zkeyPath
            );

            console.log("PROOF GENERATED!", proof);

            const pA = [proof.pi_a[0], proof.pi_a[1]];
            const pB = [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]]
            ];
            const pC = [proof.pi_c[0], proof.pi_c[1]];
            const pubSignals = publicSignals;

            const finalResult = {
                isVerified: true,
                provider: "Binance",
                kycLevel: level,
                proof: proof,
                publicSignals: publicSignals,
                commitment: publicSignals[0],
                solidityParams: { a: pA, b: pB, c: pC, input: pubSignals },
                timestamp: Date.now()
            };

            await chrome.storage.local.set({ deeproofProof: finalResult });

            chrome.runtime.sendMessage({
                action: "PROOF_GENERATED",
                proof: finalResult
            });

            updateUI('verified', 'Verified!');
            verifyBtn.textContent = 'Re-verify';
            verifyBtn.disabled = false;

        } catch (error) {
            console.error("Error:", error);
            updateUI('error', error.message || 'Error');
            verifyBtn.disabled = false;
        }
    }

    function generateSecureRandom() {
        const array = new Uint32Array(8);
        crypto.getRandomValues(array);
        let hexString = "";
        for (let i = 0; i < array.length; i++) {
            hexString += array[i].toString(16).padStart(8, "0");
        }
        return BigInt("0x" + hexString).toString();
    }

    function updateUI(state, text) {
        statusEl.textContent = text;
        if (statusIcon) {
            statusIcon.className = 'status-icon ' + state;
        }
        switch (state) {
            case 'verified':
                statusEl.style.color = '#00FF88';
                break;
            case 'processing':
                statusEl.style.color = '#00F0FF';
                break;
            case 'error':
                statusEl.style.color = '#FF4444';
                break;
            default:
                statusEl.style.color = '#888';
        }
    }
});