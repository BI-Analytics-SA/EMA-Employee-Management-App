# Plan: EMA-9 – Logo on Log In Screen

**Beads:** EMA - Employee Management App-9 · **GitHub:** #4  
**Summary:** Still using old logo; need to update the logo on the sign-in screen.

---

## Problem

The **log in (sign-in) screen** does not show the Pepl logo. It currently displays a placeholder: a styled div with the letter "P" instead of the actual brand logo. The app should show the same Pepl logo on the login screen as in the sidebar for consistent branding.

---

## Current state

- **Sign-in page** ([src/features/auth/SignInPage.tsx](src/features/auth/SignInPage.tsx), lines 183–186): Renders a fixed-size div with background and the letter "P" as placeholder.
- **Sidebar** ([src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)): Imports the logo from `@/assets/logo.png` and uses it in the app shell.
- **Logo asset** — The Pepl brand logo **exists** at [src/assets/logo.png](src/assets/logo.png). No new asset is required; the task is to use this same file on the login screen.
- **Other image files in the project:** App icons live in `public/` (favicon.png, apple-touch-icon.png, pwa-192x192.png, pwa-512x512.png). These are for browser/PWA use, not the in-app Pepl logo.
- **Design** ([DESIGN_SPEC.md](DESIGN_SPEC.md)): Brand uses Pepl logo colours (dark navy, sky blue, silver). Sidebar spec calls for "Pepl logo at top"; login screen should match.

---

## Root cause

**SignInPage does not use the logo asset** — It uses a hardcoded "P" placeholder instead of the existing image at `src/assets/logo.png`. The logo file is already in the repo and used by the Sidebar; it just needs to be used on the sign-in page as well.

---

## Implementation steps (recommended order)

1. **Update SignInPage to use the existing logo**
   - Import the logo the same way as Sidebar: `import logoImg from "@/assets/logo.png"`.
   - Replace the placeholder div (lines 183–186) with an `<img>` that uses the logo, e.g.:
     - `src={logoImg}`, `alt="Pepl"` (or appropriate alt text).
     - Sizing/styling to match the current placeholder area. Sidebar uses `h-9 w-9`; login can use a slightly larger size (e.g. `h-12 w-12`) for prominence on the sign-in card. Keep rounded corners if desired (e.g. `rounded-xl` to match current placeholder).

2. **Verify both surfaces**
   - Confirm the logo appears correctly on the sign-in (and sign-up) card.
   - Confirm the logo still appears correctly in the sidebar (collapsed and expanded).
   - Check appearance in both light and dark themes if the app supports theme switching on the login page.

---

## References

- [src/features/auth/SignInPage.tsx](src/features/auth/SignInPage.tsx) – sign-in UI; replace placeholder with logo
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx) – existing logo import and usage pattern
- [DESIGN_SPEC.md](DESIGN_SPEC.md) – brand colours and sidebar logo spec
