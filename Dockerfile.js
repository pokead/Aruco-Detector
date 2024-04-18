FROM node
ENV SSL_ACTIVE=1

WORKDIR /code
COPY . /code/

ENTRYPOINT [ "npm", "start" ]
