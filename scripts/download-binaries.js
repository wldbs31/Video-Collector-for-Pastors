// Downloads the platform binaries (yt-dlp, static ffmpeg, deno) into bin/
// before packaging. bin/ is gitignored, so this must run before every build:
//   node scripts/download-binaries.js          → binaries for current platform
//   node scripts/download-binaries.js --force  → re-download even if present
//
// deno is bundled because yt-dlp requires an external JS runtime to solve
// YouTube's n-challenge; without it downloads are throttled or fail.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BIN_DIR = path.join(__dirname, "..", "bin");
const FORCE = process.argv.includes("--force");

// ffmpeg-static provides fully static builds (the homebrew ffmpeg binary is
// dynamically linked and breaks on machines without homebrew).
const TARGETS = {
  darwin: [
    {
      name: "yt-dlp-mac",
      url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
      minBytes: 20e6,
    },
    {
      name: "ffmpeg-mac",
      url: "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-arm64",
      minBytes: 20e6,
    },
    {
      name: "deno",
      url: "https://github.com/denoland/deno/releases/latest/download/deno-aarch64-apple-darwin.zip",
      minBytes: 40e6,
      zipEntry: "deno",
    },
  ],
  win32: [
    {
      name: "yt-dlp-win.exe",
      url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
      minBytes: 10e6,
    },
    {
      name: "ffmpeg-win.exe",
      url: "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-win32-x64",
      minBytes: 20e6,
    },
    {
      name: "deno.exe",
      url: "https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip",
      minBytes: 40e6,
      zipEntry: "deno.exe",
    },
  ],
};

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

function unzipSingle(zipPath, entry, dest) {
  const tmpDir = fs.mkdtempSync(path.join(BIN_DIR, ".unzip-"));
  try {
    if (process.platform === "win32") {
      execSync(`tar -xf "${zipPath}" -C "${tmpDir}"`);
    } else {
      execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}"`);
    }
    fs.copyFileSync(path.join(tmpDir, entry), dest);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(zipPath, { force: true });
  }
}

async function main() {
  const targets = TARGETS[process.platform];
  if (!targets) {
    console.error(`Unsupported platform: ${process.platform}`);
    process.exit(1);
  }
  fs.mkdirSync(BIN_DIR, { recursive: true });

  for (const t of targets) {
    const dest = path.join(BIN_DIR, t.name);
    const existing = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
    if (!FORCE && existing >= t.minBytes) {
      console.log(`✓ ${t.name} already present (${(existing / 1e6).toFixed(1)} MB), skipping`);
      continue;
    }
    console.log(`↓ Downloading ${t.name} ...`);
    fs.rmSync(dest, { force: true }); // stale file may be read-only
    if (t.zipEntry) {
      const zipPath = dest + ".zip";
      await download(t.url, zipPath);
      unzipSingle(zipPath, t.zipEntry, dest);
    } else {
      await download(t.url, dest);
    }
    const size = fs.statSync(dest).size;
    if (size < t.minBytes) {
      throw new Error(`${t.name} is only ${size} bytes — download looks broken`);
    }
    if (process.platform !== "win32") fs.chmodSync(dest, 0o755);
    console.log(`✓ ${t.name} ready (${(size / 1e6).toFixed(1)} MB)`);
  }
  console.log("All binaries ready in bin/");
}

main().catch((e) => {
  console.error("Binary download failed:", e.message);
  process.exit(1);
});
