/** Build metadata (package.json version + Netlify commit/branch/context), injected at build time by Vite. */
export const BUILD_INFO = __BUILD_INFO__;

/** App version from package.json. */
export const APP_VERSION = BUILD_INFO.version;

/** Short commit SHA of the deployed build, e.g. "19b784b". */
export const BUILD_COMMIT = BUILD_INFO.commit.slice(0, 7);
