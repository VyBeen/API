FROM node:lts-alpine
WORKDIR /app
COPY . .
EXPOSE 8080
RUN apk add --no-cache python3 py3-pip
RUn apk add --no-cache yt-dlp
RUN chmod +x ./docker-start.sh
ENTRYPOINT [ "/app/docker-start.sh" ]
