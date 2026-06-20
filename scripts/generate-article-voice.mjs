import fs from "node:fs/promises";
import path from "node:path";
import { EdgeTTS, createSRT, createVTT } from "edge-tts-universal";

const narration = process.argv.slice(2).join(" ").trim();

if (!narration) {
  console.error("Missing narration text.");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "out", "remotion");
const audioPath = path.join(outDir, "article-voice.mp3");
const srtPath = path.join(outDir, "article-voice.srt");
const vttPath = path.join(outDir, "article-voice.vtt");

await fs.mkdir(outDir, { recursive: true });

const tts = new EdgeTTS(narration, "en-US-AndrewNeural", {
  rate: "+0%",
  volume: "+0%",
  pitch: "+0Hz",
});

const result = await tts.synthesize();
const arrayBuffer = await result.audio.arrayBuffer();

await fs.writeFile(audioPath, Buffer.from(arrayBuffer));
await fs.writeFile(srtPath, createSRT(result.subtitle));
await fs.writeFile(vttPath, createVTT(result.subtitle));

console.log(`Audio: ${audioPath}`);
console.log(`SRT: ${srtPath}`);
console.log(`VTT: ${vttPath}`);