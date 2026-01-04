# Deeproof UI Design Guideline

**Purpose**  
This document defines the UI and frontend design guidelines for Deeproof.  
The goal is to ensure a consistent, minimalistic, futuristic, and professional user interface that reflects Deeproof’s core values: privacy, trust, and cryptographic integrity.

---

## 1. Design Principles

### 1.1 Minimalism with Purpose
- Every UI element must have a clear function.
- Avoid decorative elements that do not add meaning or usability.
- White space is intentional and part of the design system.

### 1.2 Privacy-First Visual Language
- Never display sensitive or personal data, even as realistic placeholders.
- Use neutral and abstract terminology such as:
  - “Verified”
  - “Proof Generated”
  - “Identity Bound”
- Avoid labels like “Name”, “ID Number”, or “Document”.

### 1.3 Futuristic but Grounded
- Futuristic does not mean complex or flashy.
- Aim for a clean, precise, and mathematical feel.
- The UI should feel closer to a cryptography tool than a typical fintech app.

---

## 2. Visual Style

### 2.1 Color Palette
Use high-contrast colors while keeping the interface calm and focused.

**Primary**
- Near-black or deep dark background
- Off-white or light gray for main text

**Accent**
- Electric blue or cyan for primary actions and verified states
- Soft green for success states
- Amber or orange for mild warnings

**Rules**
- Only one active accent color per screen
- Avoid excessive gradients or visual noise

---

## 3. Typography

### 3.1 Font Style
- Modern, clean sans-serif fonts
- Characteristics:
  - geometric
  - highly readable at small sizes
  - not overly rounded or playful

### 3.2 Hierarchy
- Titles: clear, short, and informative
- Subtitles: one-line explanations when possible
- Body text: no more than 2–3 lines per paragraph

### 3.3 Writing Tone
- Clear and neutral
- No marketing exaggeration

Examples:
- ❌ “Your identity is now fully secured forever”
- ✅ “Identity proof successfully generated”

---

## 4. Layout & Spacing

### 4.1 Grid System
- Use a consistent grid layout
- Avoid uneven or jumping layouts
- Primary actions should stay within the central focus area

### 4.2 Spacing Rules
- Use generous spacing between sections
- Do not overload a single screen with information
- Scrolling is preferred over dense layouts

---

## 5. Animation & Motion

### 5.1 Animation Philosophy
Animations should be:
- subtle
- fast
- informative

They exist to explain processes, not to impress visually.

### 5.2 Allowed Animations
- Fade in and fade out
- Small, subtle slide transitions
- Progress indicators for:
  - data fetching
  - proof generation
  - transaction submission

### 5.3 Avoid
- Bounce or elastic effects
- Infinite or decorative loops
- Heavy glow, particles, or flashy effects

---

## 6. State & Feedback

### 6.1 Clear System States
Every user action must have a clear state:
- Idle
- Processing
- Success
- Failed

### 6.2 Status Communication
Use honest and simple system messages:
- “Generating proof locally…”
- “Waiting for wallet confirmation”
- “Proof verified on-chain”

Avoid unnecessary technical jargon, but do not oversimplify to the point of being misleading.

---

## 7. Components Guideline

### 7.1 Buttons
- Only one primary button per screen
- Use action-based labels:
  - “Verify Identity”
  - “Generate Proof”
  - “Submit Proof”

### 7.2 Cards
- Use cards for:
  - status display
  - step progression
  - identity summaries (without personal data)
- Keep shadows minimal or none

### 7.3 Icons
- Simple and line-based
- Consistent style and sizing across the app

---

## 8. UX Philosophy

### 8.1 Invisible Complexity
- Users do not need to understand ZK, Merkle Trees, or Nullifiers.
- The UI should only communicate:
  - what is happening
  - what the user needs to do
  - what the result is

### 8.2 Trust Through Clarity
- Do not hide processes behind vague loading states
- Show step-by-step progress clearly and briefly
- It is better to say “this may take a few seconds” than to feel unresponsive

---

## 9. Do & Don’t Summary

### Do
- Prioritize clarity and consistency
- Use consistent terminology
- Treat privacy as a first-class UI requirement

### Don’t
- Display personal or identifiable data
- Overuse animations
- Use excessive marketing language
- Design the UI like a retail wallet or exchange app

---

## 10. Design Goal

The Deeproof interface should feel like:
a serious, modern, and trustworthy cryptographic tool  
not a typical KYC application.

If the UI feels simple yet powerful, the design has succeeded.
