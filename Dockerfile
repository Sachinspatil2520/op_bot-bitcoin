FROM node:20 AS builder
WORKDIR /app
COPY package.json .
COPY yarn.lock .
ARG ENV=dev
RUN echo "ENV: ${ENV}"
RUN export NODE_ENV=${ENV}
RUN ["yarn", "install", "--frozen-lockfile"]
COPY . .
RUN ["yarn", "generate:db:client"]
RUN yarn build
RUN cp -r src/db/generated dist/db/generated
RUN ls dist/db/generated/client
EXPOSE 8088
CMD ["node", "dist/server.js"]