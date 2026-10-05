const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = path.join(process.cwd(), "src/assets");
const outputDir = path.join(process.cwd(), "src/assets_optimized");

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Рекурсив бүх зураг гаргах функц
function getAllImages(dir) {
  const results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...getAllImages(filePath));
    } else if (filePath.match(/\.(png|jpe?g|webp|gif)$/i)) {
      results.push(filePath);
    }
  });

  return results;
}

async function optimizeAllImages() {
  const files = getAllImages(inputDir);
  console.log(`🧩 Нийт ${files.length} зураг optimize хийнэ...`);

  for (const inputPath of files) {
    const relativePath = path.relative(inputDir, inputPath);
    const outputPath = path.join(outputDir, relativePath);
    const outputFolder = path.dirname(outputPath);

    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

    try {
      const ext = path.extname(inputPath).toLowerCase();
      let image = sharp(inputPath);

      // PNG → transparency хадгална
      if (ext === ".png") {
        image = image
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 });
      }
      // JPEG / JPG → шахаж optimize хийнэ
      else if (ext === ".jpg" || ext === ".jpeg") {
        image = image
          .flatten({ background: "#ffffff" }) // ил тод хэсгийг цагаан болгоно (JPEG-д transparency байхгүй)
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true, progressive: true });
      }
      // WebP → transparency хадгална
      else if (ext === ".webp") {
        image = image
          .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 });
      }
      // GIF эсвэл бусад
      else {
        fs.copyFileSync(inputPath, outputPath);
        console.log(`ℹ Copied without optimization: ${relativePath}`);
        continue;
      }

      await image.toFile(outputPath);
      console.log(`✅ Optimized: ${relativePath}`);
    } catch (err) {
      console.error(`❌ Error optimizing ${relativePath}:`, err.message);
    }
  }

  console.log("🎉 Бүх зураг optimize хийгдлээ!");
}

optimizeAllImages().catch((err) => console.error("❌ Unexpected error:", err));
