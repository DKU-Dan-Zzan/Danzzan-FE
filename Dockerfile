FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# 컨테이너에서는 nginx가 /api를 BE로 프록시한다.
ENV VITE_API_BASE_URL=/api
ENV VITE_TICKETING_API_BASE_URL=/api
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
# 원본 저장소의 일부 정적 파일이 0600 권한이라 그대로 복사되면 nginx 유저가
# 읽지 못해 403이 난다. 소스 권한과 무관하게 읽기 가능하도록 정규화한다.
RUN chmod -R a+rX /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
