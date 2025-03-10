const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Kafka } = require("kafkajs");
const ffmpeg = require("fluent-ffmpeg");

// ---------- Configuration ----------
const storageDir = path.join(__dirname, "storage");
const tempDir = path.join(__dirname, "temp");
const encodedDir = path.join(__dirname, "temp_encoded");
const kafkaBrokers = ["localhost:9092"];
const outputFormats = ["mp4", "avi", "webm", "mkv"];
const ytDlpPath = "C:\\Users\\Andrian\\AppData\\Roaming\\Python\\Python313\\Scripts\\yt-dlp.exe";

// Ensure necessary folders exist
[storageDir, tempDir, encodedDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Kafka setup
const kafka = new Kafka({ clientId: "video-pipeline", brokers: kafkaBrokers });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "video-consumers" });

// ---------- Helper Functions ----------
async function uploadToS3(localFilePath, s3Key) {
  return new Promise((resolve, reject) => {
    const destPath = path.join(storageDir, s3Key);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFile(localFilePath, destPath, (err) => {
      if (err) return reject(err);
      console.log(` Uploaded to storage: ${destPath}`);
      resolve();
    });
  });
}

async function downloadFromS3(s3Key, localPath) {
  return new Promise((resolve, reject) => {
    const srcPath = path.join(storageDir, s3Key);
    fs.copyFile(srcPath, localPath, (err) => {
      if (err) return reject(err);
      console.log(` Downloaded from storage: ${srcPath}`);
      resolve(localPath);
    });
  });
}

async function downloadYouTubeVideo(videoUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `\"${ytDlpPath}\" -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -o "${outputPath}.mp4" ${videoUrl}`;
    console.log(` Downloading: ${videoUrl}`);
    exec(command, { shell: "cmd.exe" }, (error, stdout) => {
      if (error) return reject(`yt-dlp error: ${error.message}`);
      console.log(` Download complete: ${outputPath}.mp4`);
      resolve(`${outputPath}.mp4`);
    });
  });
}

async function produceEvent(s3Key) {
  await producer.connect();
  await producer.send({
    topic: "video-events",
    messages: [{ value: s3Key }],
  });
  console.log(` Produced event for: ${s3Key}`);
  await producer.disconnect();
}

async function encodeVideo(inputPath, format) {
  return new Promise((resolve, reject) => {
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(encodedDir, `${inputBasename}.${format}`);

    ffmpeg(inputPath)
      .output(outputPath)
      .on("end", () => {
        console.log(`✅ Encoded to ${format}: ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => reject(`FFmpeg error: ${err.message}`))
      .run();
  });
}

// ---------- Producer ----------
async function runProducer() {
  let ids = ["-RXA143mC_0", "VIPH9lY7nUw", "fai_cwpo4dA"];
  for (let id of ids) {
    try {
      const outputFilename = `downloaded_video_${id}`;
      const localOutputPath = path.join(tempDir, outputFilename);
      const videoUrl = `https://www.youtube.com/watch?v=${id}`;

      // Download from YouTube
      const downloadedPath = await downloadYouTubeVideo(videoUrl, localOutputPath);

      // Upload to storage
      const s3Key = `videos/${outputFilename}.mp4`;
      await uploadToS3(downloadedPath, s3Key);

      // Produce Kafka event
      await produceEvent(s3Key);

      // Cleanup temp file
      fs.unlinkSync(downloadedPath);
    } catch (err) {
      console.error(` Producer error: ${err}`);
    }
  }
}

// ---------- Consumer ----------
async function processVideo(s3Key) {
  try {
    const localVideoPath = path.join(encodedDir, path.basename(s3Key));

    console.log(`🎥 Processing video: ${s3Key}`);
    await downloadFromS3(s3Key, localVideoPath);

    for (let format of outputFormats) {
      try {
        const encodedPath = await encodeVideo(localVideoPath, format);
        const encodedS3Key = `encoded/${path.basename(encodedPath)}`;
        await uploadToS3(encodedPath, encodedS3Key);
      } catch (err) {
        console.error(` Error encoding to ${format}: ${err}`);
      }
    }

    console.log(`Finished processing: ${s3Key}`);
  } catch (err) {
    console.error(` Error processing video ${s3Key}: ${err}`);
  }
}

async function runConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "video-events", fromBeginning: true });

  console.log("🔄 Consumer waiting for messages...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const s3Key = message.value.toString();
      console.log(`Received event: ${s3Key}`);
      await processVideo(s3Key);
    },
  });
}

// ---------- Main Entry Point ----------
async function main() {
  const mode = process.argv[2];
  if (!mode) {
    console.error("Please specify mode: producer or consumer");
    process.exit(1);
  }

  if (mode === "producer") {
    await runProducer();
  } else if (mode === "consumer") {
    await runConsumer();
  } else {
    console.error(' Unknown mode. Use "producer" or "consumer".');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(" Fatal error:", err);
});
