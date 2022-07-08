FROM node

WORKDIR /app

COPY ./portal ./portal
COPY ./cronjob ./cronjob

WORKDIR /app/portal
RUN yarn install

WORKDIR /app/cronjob
RUN yarn install
RUN yarn run build

CMD ["yarn", "start"]
