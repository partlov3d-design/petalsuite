"use strict";
const motion = document.querySelector("#motion-toggle");
let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
try { const saved = localStorage.getItem("xavier-reduce-motion") ?? localStorage.getItem("petal-reduce-motion"); if (saved !== null) reduced = saved === "true"; } catch {}
function applyMotion() { document.documentElement.classList.toggle("reduce-motion", reduced); motion.setAttribute("aria-pressed", String(reduced)); motion.textContent = reduced ? "Enable motion" : "Reduce motion"; }
applyMotion();
motion.addEventListener("click", () => { reduced = !reduced; applyMotion(); try { localStorage.setItem("xavier-reduce-motion", String(reduced)); } catch {} });
const previews = {
 replay: ["REPLAY / FRAMEPILOT", "Make every input yours.", "Record in practice, refine a section, then replay it on the same saved physics grid.", "Workflow", "Record → edit → play", "Library", "Your macros, together", "Website illustration. Press Insert in GD to open the shared menu; customize shortcuts in Settings."],
 analysis: ["ANALYSIS / FRAME WINDOWS", "Measure the room you have.", "Test shifted inputs through real game physics. Keep unresolved timings unmeasured and save completed analysis with the macro.", "Method", "Real-physics timing checks", "Results", "Saved for the same macro", "Performance work preserves trial semantics. No claim of a universal speedup or perfect measurement."],
 audio: ["AUDIO / JUKEBOX + CLICKS", "Give your run its sound.", "Choose a soundtrack, adjust its offset and select separate player click packs. Eleven bundled community packs add 295 samples.", "Soundtrack", "NONG selection + offsets", "Click packs", "Separate P1 and P2", "Some online entries require a local import. Community packs retain their creator metadata; Kenney CC0 defaults are also included."],
 input: ["DISPLAY / INPUT HUD", "A tap is not a hold.", "Upward-scrolling orange and red lanes show press duration. Configure CPS units, maximum and totals to suit your recording.", "Player 1", "Orange hold trail", "Player 2", "Red hold trail", "CPS, maximum and totals reset on death and restart. This illustration is decorative; the game HUD follows actual input events."],
 practice: ["PRACTICE / UTILITIES + RUN INFO", "Make the next attempt count.", "See where your run started, keep its history and review recent death footage. Noclip sessions stay clearly tagged.", "Utilities", "Noclip limit + tint", "Run history", "Attempts + completions", "Death Replay capture is opt-in and consumes CPU/GPU resources. Noclip accuracy measures collision-free simulation time."]
};
const tabs = [...document.querySelectorAll("[data-tab]")];
function selectTab(tab, focus = false) {
 const data = previews[tab.dataset.tab];
 for (const item of tabs) { const selected = item === tab; item.setAttribute("aria-selected", String(selected)); item.tabIndex = selected ? 0 : -1; }
 document.querySelector("#preview-panel").setAttribute("aria-labelledby", tab.id);
 document.querySelector(".timeline-art").hidden = tab.dataset.tab === "input";
 document.querySelector("#input-tab-art").hidden = tab.dataset.tab !== "input";
 ["preview-kicker", "preview-title", "preview-description", "metric-one-label", "metric-one", "metric-two-label", "metric-two", "preview-note"].forEach((id, i) => document.getElementById(id).textContent = data[i]);
 if (focus) tab.focus();
}
for (const tab of tabs) { tab.addEventListener("click", () => selectTab(tab)); tab.addEventListener("keydown", event => { let index = tabs.indexOf(tab); if (event.key === "ArrowRight") index = (index + 1) % tabs.length; else if (event.key === "ArrowLeft") index = (index + tabs.length - 1) % tabs.length; else if (event.key === "Home") index = 0; else if (event.key === "End") index = tabs.length - 1; else return; event.preventDefault(); selectTab(tabs[index], true); }); }
selectTab(tabs[0]);
let checksum = "";
document.querySelector("#copy-sha").addEventListener("click", async () => { try { await navigator.clipboard.writeText(checksum); document.querySelector("#copy-sha").textContent = "Copied"; } catch { document.querySelector("#copy-sha").textContent = "Select the checksum to copy"; } });
async function showRelease() {
 const status = document.querySelector("#manifest-status");
 try {
  const response = await fetch("updates.json", {cache: "no-store"}); if (!response.ok) throw new Error("Manifest unavailable");
  const signed = await response.json(); const bytes = Uint8Array.from(atob(signed.payload), char => char.charCodeAt(0));
  const keyResponse = await fetch("update-public-key.json"); if (!keyResponse.ok) throw new Error("Verification key unavailable");
  const key = await crypto.subtle.importKey("jwk", await keyResponse.json(), {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["verify"]);
  const signature = Uint8Array.from(atob(signed.signature), char => char.charCodeAt(0));
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, bytes)) throw new Error("Invalid release signature");
  const release = JSON.parse(new TextDecoder().decode(bytes));
  if (release.schema !== 1 || !/^\d+\.\d+\.\d+$/.test(release.version) || !/^[A-F0-9]{64}$/.test(release.sha256)) throw new Error("Invalid release information");
  document.querySelectorAll("[data-version]").forEach(item => item.textContent = "v" + release.version);
  checksum = release.sha256; document.querySelector("#installer-sha").textContent = checksum; document.querySelector("#copy-sha").disabled = false;
  const safeAsset = value => typeof value === "string" && /^downloads\/[A-Za-z0-9_.-]+\.exe$/.test(value) && !value.includes("..");
  if (safeAsset(release.download)) document.querySelectorAll('[data-download="setup"]').forEach(link => link.href = release.download);
  if (safeAsset(release.updater)) document.querySelectorAll('[data-download="updater"]').forEach(link => link.href = release.updater);
  if (Array.isArray(release.notes)) { const notes = document.querySelector("#release-notes"); notes.replaceChildren(); for (const text of release.notes.slice(0, 8)) { const item = document.createElement("li"); item.textContent = String(text); notes.append(item); } }
  const parts = release.version.split(".").map(Number); const modern = parts[0] > 0 || parts[1] >= 7;
  document.querySelector("#release-identity").textContent = modern ? "Xavier Bot. Existing libraries retain their compatible storage paths." : "The current " + release.version + " installer uses the previous Petal Suite name.";
  status.textContent = "Release signature verified. The Windows updater also checks the download hash.";
 } catch {
  document.querySelector("#installer-sha").textContent = "Release information unavailable. Try again later.";
  status.textContent = "Could not verify the online manifest. The updater can still use its bundled offline repair.";
 }
}
showRelease();
