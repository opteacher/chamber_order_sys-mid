FROM node:latest
WORKDIR /app
COPY . /app
RUN npm config set strict-ssl false
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --unsafe-perm=true --allow-root
RUN npm run build

FROM mhart/alpine-node:latest
# RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
# RUN apk update && apk add ca-certificates
# RUN apk add curl
# RUN apk add busybox-extras
RUN npm config set strict-ssl false
RUN npm install -g npm@8.14.0 && npm i -g http-server
WORKDIR /public
COPY --from=0 /app/dist /public
EXPOSE 8080
ENTRYPOINT [ "http-server" ]
CMD [ "--proxy", "http://chamber_order_sys:8580" ]