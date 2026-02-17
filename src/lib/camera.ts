/**
 * Camera utilities: enumerate video devices and prefer back/rear camera on mobile.
 * Used by BarcodeScanner and ImageCapture for consistent default and camera switching.
 */

export type CameraDevice = {
  deviceId: string;
  label: string;
};

const BACK_LABEL_PATTERNS = /back|rear|environment|facing back|posterior/i;
const FRONT_LABEL_PATTERNS = /front|user|facing front|selfie/i;

/**
 * Returns true if the device label suggests a back/rear camera (preferred for scanning and documents).
 */
export function isBackCamera(label: string): boolean {
  return BACK_LABEL_PATTERNS.test(label) || (!FRONT_LABEL_PATTERNS.test(label) && label.length > 0);
}

/**
 * Returns true if the device label suggests a front camera.
 */
export function isFrontCamera(label: string): boolean {
  return FRONT_LABEL_PATTERNS.test(label);
}

/**
 * Enumerate ALL video input devices. Labels may be empty until camera permission has been granted.
 * Sorts so back/rear camera is first when labels are available (for default selection).
 */
export async function getVideoDevices(): Promise<CameraDevice[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices
    .filter((d) => d.kind === "videoinput")
    .map((d) => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 8)}` }));

  // Prefer back camera first (environment) for scanner and photo capture
  videoInputs.sort((a, b) => {
    const aBack = isBackCamera(a.label);
    const bBack = isBackCamera(b.label);
    if (aBack && !bBack) return -1;
    if (!aBack && bBack) return 1;
    const aFront = isFrontCamera(a.label);
    const bFront = isFrontCamera(b.label);
    if (aFront && !bFront) return 1;
    if (!aFront && bFront) return -1;
    return a.label.localeCompare(b.label);
  });

  return videoInputs;
}

/**
 * Returns a pair [backCamera, frontCamera] for simple toggle switching.
 * Modern phones often have 3+ back cameras (ultra-wide, main, telephoto);
 * this picks the first back and first front camera so toggle always flips direction.
 * Returns only cameras that were found (may be 0, 1, or 2 entries).
 */
export async function getToggleCameras(): Promise<CameraDevice[]> {
  const all = await getVideoDevices();
  const back = all.find((c) => BACK_LABEL_PATTERNS.test(c.label));
  const front = all.find((c) => isFrontCamera(c.label));

  // If we couldn't classify (labels empty / unusual), fall back to first two
  if (!back && !front) return all.slice(0, 2);

  const result: CameraDevice[] = [];
  if (back) result.push(back);
  if (front) result.push(front);
  return result;
}

/**
 * Get MediaTrackConstraints for the preferred back camera or a specific device.
 * Use for getUserMedia({ video: getVideoConstraints(...) }).
 */
export function getVideoConstraints(deviceId?: string | null): MediaTrackConstraints {
  if (deviceId) {
    return {
      deviceId: { exact: deviceId },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  }
  return {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };
}
