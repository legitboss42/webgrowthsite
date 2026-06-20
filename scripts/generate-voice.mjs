import fs from "node:fs/promises";
import path from "node:path";
import { EdgeTTS } from "edge-tts-universal";

const text = process.argv.slice(2).join(" ").trim();

if (!text) {
  console.error("Missing text.");
  process.exit(1);
}

const outputPath = path.join(process.cwd(), "out", "voice-test.mp3");

await fs.mkdir(path.dirname(outputPath), { recursive: true });

const tts = new EdgeTTS(text, "en-US-AndrewNeural", {
  rate: "+0%",
  volume: "+0%",
  pitch: "+0Hz",
});

const result = await tts.synthesize();
const arrayBuffer = await result.audio.arrayBuffer();

await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

console.log(`Voice generated: ${outputPath}`);