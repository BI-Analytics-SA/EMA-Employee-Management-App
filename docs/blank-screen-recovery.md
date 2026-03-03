# Blank screen / "MIME type text/html" recovery

If you see a blank screen and console errors like:

- **Failed to load module script: Expected JavaScript but server responded with MIME type "text/html"**
- **Refused to apply style ... MIME type ('text/html') is not a supported stylesheet**

the browser is receiving the HTML page instead of the JS/CSS assets. That usually means:

1. **Stale cache** – The browser or the **service worker** is serving an old `index.html` that references asset filenames (e.g. `index-BSx_2FKa.js`) that no longer exist on the server after a new deploy.

**Recovery steps:**

1. **Unregister the service worker**  
   - Open DevTools (F12) → **Application** (Chrome) or **Storage** (Firefox).  
   - Go to **Service Workers**.  
   - Click **Unregister** for this site.

2. **Hard refresh**  
   - **Windows/Linux:** `Ctrl + Shift + R` (or `Ctrl + F5`).  
   - **Mac:** `Cmd + Shift + R`.

3. **If it still fails:** clear site data for this origin  
   - DevTools → **Application** → **Storage** → **Clear site data** (or clear cookies/storage for the current origin).

After that, the next load should fetch the latest `index.html` and the correct asset URLs for the current deploy.

**Prevention:** The app sets `Cache-Control: no-cache` on `index.html` at the server and in the HTML meta tag so caches revalidate. The service worker still caches the shell; the update-banner flow is meant to prompt users to refresh when a new version is deployed.
