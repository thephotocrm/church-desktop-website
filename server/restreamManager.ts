import { spawn, ChildProcess } from "child_process";
import { storage } from "./storage";
import { decrypt } from "./encryption";

const HLS_SOURCE = process.env.STREAM_HLS_URL || "http://129.212.184.68:8888/live/live/index.m3u8";

interface ActiveProcess {
  process: ChildProcess;
  platform: string;
}

const activeProcesses: Map<string, ActiveProcess> = new Map();

const DEFAULT_RTMP_URLS: Record<string, string> = {
  youtube: "rtmp://a.rtmp.youtube.com/live2",
  facebook: "rtmps://live-api-s.facebook.com:443/rtmp",
};

export async function startRestreaming(): Promise<void> {
  console.log("[RestreamManager] Starting restreaming...");
  const configs = await storage.getPlatformConfigs();

  for (const config of configs) {
    if (!config.enabled || !config.streamKey) {
      console.log(`[RestreamManager] Skipping ${config.platform} (disabled or no key)`);
      continue;
    }

    // Skip if already active
    if (activeProcesses.has(config.platform)) {
      console.log(`[RestreamManager] ${config.platform} already active, skipping`);
      continue;
    }

    try {
      const streamKey = decrypt(config.streamKey);
      const rtmpUrl = config.rtmpUrl || DEFAULT_RTMP_URLS[config.platform];
      if (!rtmpUrl) {
        console.error(`[RestreamManager] No RTMP URL for ${config.platform}`);
        continue;
      }

      const targetUrl = `${rtmpUrl}/${streamKey}`;

      console.log(`[RestreamManager] Spawning ffmpeg for ${config.platform}`);
      const ffmpegProcess = spawn("ffmpeg", [
        "-i", HLS_SOURCE,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "flv",
        "-flvflags", "no_duration_filesize",
        targetUrl,
      ], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      activeProcesses.set(config.platform, {
        process: ffmpegProcess,
        platform: config.platform,
      });

      await storage.upsertRestreamStatus(config.platform, {
        status: "active",
        startedAt: new Date(),
        errorMessage: null,
        stoppedAt: null,
      });

      ffmpegProcess.stderr?.on("data", (data: Buffer) => {
        const msg = data.toString();
        // Only log significant errors, not ffmpeg progress output
        if (msg.includes("Error") || msg.includes("error")) {
          console.error(`[RestreamManager][${config.platform}] ${msg}`);
        }
      });

      ffmpegProcess.on("close", async (code) => {
        console.log(`[RestreamManager] ffmpeg for ${config.platform} exited with code ${code}`);
        activeProcesses.delete(config.platform);

        if (code !== 0 && code !== null) {
          await storage.upsertRestreamStatus(config.platform, {
            status: "error",
            errorMessage: `ffmpeg exited with code ${code}`,
            stoppedAt: new Date(),
          });
        } else {
          await storage.upsertRestreamStatus(config.platform, {
            status: "idle",
            stoppedAt: new Date(),
          });
        }
      });

      ffmpegProcess.on("error", async (err) => {
        console.error(`[RestreamManager] Failed to start ffmpeg for ${config.platform}:`, err);
        activeProcesses.delete(config.platform);
        await storage.upsertRestreamStatus(config.platform, {
          status: "error",
          errorMessage: err.message,
          stoppedAt: new Date(),
        });
      });
    } catch (err) {
      console.error(`[RestreamManager] Error starting ${config.platform}:`, err);
      await storage.upsertRestreamStatus(config.platform, {
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        stoppedAt: new Date(),
      });
    }
  }
}

export async function stopRestreaming(): Promise<void> {
  console.log("[RestreamManager] Stopping all restreaming...");

  for (const [platform, active] of Array.from(activeProcesses.entries())) {
    try {
      active.process.kill("SIGTERM");
      // Give it 5s to exit gracefully, then force kill
      setTimeout(() => {
        if (active.process.killed === false) {
          active.process.kill("SIGKILL");
        }
      }, 5000);

      await storage.upsertRestreamStatus(platform, {
        status: "idle",
        stoppedAt: new Date(),
      });
    } catch (err) {
      console.error(`[RestreamManager] Error stopping ${platform}:`, err);
    }
  }

  activeProcesses.clear();
}

export function getActiveProcessCount(): number {
  return activeProcesses.size;
}
