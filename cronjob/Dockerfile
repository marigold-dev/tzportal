FROM node

WORKDIR /app

COPY ./portal /app/portal

WORKDIR /app/portal
RUN yarn install

COPY ./cronjob /app/cronjob

WORKDIR /app/cronjob
RUN yarn install
RUN yarn run build

CMD ["yarn", "start"]
