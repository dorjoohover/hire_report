FROM node:20

# canvas deps
RUN apt-get update && apt-get install -y \
  python3 \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY . .

RUN npm run build

# Тайлангийн зургуудыг (src/assets) тайланд харагдах хэмжээнд тааруулж src/assets_optimized-д
# бэлдэнэ (scripts/optimize-images.ts) — PDF жижиг, render хурдан. Алдаа гарвал build унахгүй:
# AssetsService анхны src/assets-ийг ашиглана. Runtime-д буцаах: ASSETS_OPTIMIZED=0.
RUN npm run optimize:images

CMD ["npm", "run", "start:prod"]
