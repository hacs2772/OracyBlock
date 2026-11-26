# OracyBlock 웹 (React) - 빌드한 뒤 nginx로 보여 줘요
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.28-alpine
# nginx.conf 를 틀(template)로: 켜질 때 ${NAVER_SITE_VERIFICATION} 을 .env 값으로 채워요
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
