FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package.json package.json
COPY node_modules node_modules
COPY dist dist

CMD [ "yarn", "prod" ]
