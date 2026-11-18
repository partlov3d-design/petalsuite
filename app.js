'use strict';
const motion = document.querySelector('#motion-toggle');
let reduced = false;
try { reduced = localStorage.getItem('petal-reduce-motion') === 'true'; } catch {}
function applyMotion() { document.body.classList.toggle('reduce-motion', reduced); document.documentElement.classList.toggle('reduce-motion', reduced); motion.setAttribute('aria-pressed', String(reduced)); motion.textContent = reduced ? 'Enable motion' : 'Reduce motion'; }
applyMotion();
motion.addEventListener('click', () => { reduced = !reduced; applyMotion(); try { localStorage.setItem('petal-reduce-motion', String(reduced)); } catch {} });
let checksum = '';
document.querySelector('#copy-sha').addEventListener('click', async () => { try { await navigator.clipboard.writeText(checksum); document.querySelector('#copy-sha').textContent = 'Copied'; } catch { document.querySelector('#copy-sha').textContent = 'Select checksum to copy'; } });
async function showRelease() {
  const status = document.querySelector('#manifest-status');
  try {
    const response = await fetch('updates.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Manifest unavailable');
    const signed = await response.json();
    const bytes = Uint8Array.from(atob(signed.payload), char => char.charCodeAt(0));
    const keyResponse = await fetch('update-public-key.json');
    if (!keyResponse.ok) throw new Error('Verification key unavailable');
    const key = await crypto.subtle.importKey('jwk', await keyResponse.json(), {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify']);
    const signature = Uint8Array.from(atob(signed.signature), char => char.charCodeAt(0));
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, bytes)) throw new Error('Invalid release signature');
    const release = JSON.parse(new TextDecoder().decode(bytes));
    if (release.schema !== 1 || !/^\d+\.\d+\.\d+$/.test(release.version) || !/^[A-F0-9]{64}$/.test(release.sha256)) throw new Error('Invalid release information');
    document.querySelector('[data-version]').textContent = 'v' + release.version;
    document.querySelector('[data-fp]').textContent = release.framepilot;
    document.querySelector('[data-jb]').textContent = release.jukebox;
    checksum = release.sha256;
    document.querySelector('#installer-sha').textContent = checksum;
    document.querySelector('#copy-sha').disabled = false;
    const safeAsset = value => typeof value === 'string' && /^downloads\/[A-Za-z0-9_.-]+\.exe$/.test(value) && !value.includes('..');
    if (safeAsset(release.download)) for (const link of document.querySelectorAll('a[href*="PetalSuite-Setup-"]')) link.href = release.download;
    if (safeAsset(release.updater)) for (const link of document.querySelectorAll('a[href*="Updater-"]')) link.href = release.updater;
    if (Array.isArray(release.notes)) {
      const notes = document.querySelector('#release-notes'); notes.replaceChildren();
      for (const text of release.notes.slice(0, 8)) { const item = document.createElement('li'); item.textContent = String(text); notes.append(item); }
    }
    status.textContent = 'Release manifest signature verified. The Windows updater also verifies the download hash.';
  } catch {
    document.querySelector('#installer-sha').textContent = 'Release information unavailable. Try again later.';
    status.textContent = 'The updater can still use its bundled offline repair.';
  }
}
showRelease();
