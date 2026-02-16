# Specification

## Summary
**Goal:** Make SocialConsole installable as a PWA with offline app-shell support and best-effort in-app notifications for new channel messages.

**Planned changes:**
- Add a valid web app manifest with required metadata (name/short_name, start_url, standalone display, theme/background colors) and icon references.
- Register a service worker in production builds so the app is controllable after first load and can be launched offline.
- Implement offline support by caching the app shell (HTML/JS/CSS/static assets) and adding clear offline UI messaging plus graceful handling of failed network requests.
- Add a notifications setting (enable/disable) that requests permission only after user interaction and shows Web Notifications for newly detected channel messages while the app is running.
- Update message compose UI to be offline-friendly by disabling sending with an explanation (or allowing local drafts) and ensuring no backend mutations are attempted while offline.
- Add required generated PWA icon assets under `frontend/public/assets/generated` and reference them from the manifest.

**User-visible outcome:** Users can install SocialConsole on mobile/desktop, reopen it offline to see the app UI with clear offline status, optionally enable notifications for new channel messages while the app is open/in a background tab, and see message sending behavior adapt appropriately when offline.
