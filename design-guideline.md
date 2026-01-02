# Deeproof Design System & Brand Guideline

**Version:** 1.0  
**Core Philosophy:** "The Invisible Fortress"  
**Vibe:** Institutional Trust, Cryptographic Privacy, Minimalist, Precision.

---

## 1. Brand Personality

**Deeproof** is not a "social app." It is critical security infrastructure.

- **Serious:** Avoid excessive emojis or playful illustrations. We deal with identity and assets.
- **Precise:** Every pixel and interaction must feel calculated, like a mathematical operation.
- **Transparent:** The UI must be clear and reassuring, never confusing. Security comes from clarity.

---

## 2. Color Palette (The "Midnight" Theme)

The dominant theme is **Dark Mode First** to represent "Deep" (privacy/depth), with bright light accents to represent "Proof" (truth/verification).

### Primary Colors (Background & Surface)
*Used for the Extension background and Website canvas.*

- **Void Black:** `#050507` (Main Background - Darker than standard black)
- **Deep Slate:** `#111318` (Cards / Containers)
- **Gunmetal:** `#1F2229` (Borders / Separators)

### Accent Colors (Action & Status)
*Used for buttons, status indicators, and interactive elements.*

- **ZK Cyan:** `#00F0FF` (Primary Brand Color - Represents Tech/ZK)
- **Compliance Green:** `#10B981` (Status: Verified / Success)
- **Alert Amber:** `#F59E0B` (Status: Verifying / Processing)
- **Error Red:** `#EF4444` (Status: Failed / Rejected)

### Typography Colors
- **Text Primary:** `#F3F4F6` (High contrast, almost white)
- **Text Secondary:** `#9CA3AF` (Grey, for labels or descriptions)
- **Text Muted:** `#4B5563` (For placeholders or disabled text)

---

## 3. Typography

We use a combination of modern sans-serif for UI elements and monospaced fonts for cryptographic data.

### Primary Font: Inter or Plus Jakarta Sans
*Used for Headings, Buttons, and Body Text.*

- **Characteristics:** Clean, highly readable at small sizes (crucial for Chrome Extensions).
- **H1 (Headline):** Bold, Tight letter spacing.
- **Body:** Regular, optimized for legibility.

### Data Font: JetBrains Mono or Fira Code
*Used for displaying: Wallet Addresses, Hashes, Commitment IDs, Nullifiers.*

- **Characteristics:** Fixed width, clearly distinguishes 0 (zero) from O (letter).
- **Example:** `0x71C...9A21`

---

## 4. Logo & Iconography

### Logo Concept
- **Symbol:** A fusion of a Shield and Layers. Alternatively, an abstract "D" shape that resembles a locked vault.
- **Style:** Line art (thin strokes), geometric, avoiding heavy fill blocks.

### Icon Set
Use icon packs like **Phosphor Icons** or **Heroicons** with an **Outline style** (approx. 2px stroke).

- **Common Icons:** `ShieldCheck` (Verified), `Lock` (Private), `Fingerprint` (Identity), `Link` (Binding).

---

## 5. UI Components (Extension Focus)

Since the main product is a Chrome Extension, screen real estate is limited (typically 350px - 400px width).

### A. The "Glass" Card (Container)
Use a subtle glassmorphism effect to create a modern feel without looking cheap.

- **Background:** `rgba(17, 19, 24, 0.8)`
- **Border:** `1px solid #1F2229`
- **Backdrop-filter:** `blur(10px)`

### B. Action Button (The "Start" Button)
The main call-to-action (CTA) must stand out significantly.

- **Style:** Subtle Gradient or Solid ZK Cyan.
- **Shape:** Rounded corners (4px - 6px). Avoid full "pill shapes" to maintain a serious, industrial look.
- **Hover State:** Glow effect.
  - `box-shadow: 0 0 15px rgba(0, 240, 255, 0.3)`

### C. Hash Display
Never display long hashes in their raw form.

- **Format:** `0x1234...abcd` (Truncated).
- **Interaction:** Always provide a small "Copy" button next to it.
- **Background:** Use a very faint grey background (`#1F2229`) around the hash to frame it as a data block.

### D. Status Indicator (Pulse)
When the system is fetching data from Reclaim (Processing):

- Use a **"Breathing/Pulse"** animation on the logo or container border.
- Avoid standard spinning loaders. Use a thin, sleek progress bar at the top of the extension.

---

## 6. UX Writing (Tone of Voice)

The language should provide clear, calming instructions. It should sound like a secure system, not a chatbot.

- **Do:** "Verifying your identity commitment..."
- **Don't:** "Checking who you are..." (Too personal/creepy).

- **Do:** "Binding successful. Your privacy is preserved."
- **Don't:** "You are connected!" (Too casual).

**Keywords:** Verify, Commit, Bind, Proof, Secure, Private.

---

## 7. Visual Hierarchy (Extension Layout)

1.  **Header:** Deeproof Logo (Left), Wallet Connection Status (Right).
2.  **Hero Section:** Current User KYC Status.
    - **Unverified:** Grey Icon, Text: "Identity Unverified".
    - **Verified:** Large Green Icon, Text: "Verified Human".
3.  **Action Area:**
    - **Primary Button:** "Verify via Binance" (if unverified).
    - **Secondary Button:** "Generate Proof" (if verified).
4.  **Data Section (Collapsible):**
    - Display technical details like Commitment ID or Merkle Root only if the user clicks "Show Details". (Don't overwhelm the average user with numbers).
5.  **Footer:** App Version & Support Link.

---

## Tailwind Config Concept (Snippet)

```javascript
// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#050507',
        surface: '#111318',
        border: '#1F2229',
        primary: {
          DEFAULT: '#00F0FF', // ZK Cyan
          dim: 'rgba(0, 240, 255, 0.1)',
        },
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 240, 255, 0.5)',
      }
    },
  },
}
```