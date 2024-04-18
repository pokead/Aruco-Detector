FROM python:3.11
ENV PYTHONUNBUFFERED=1
ENV SSL_ACTIVE=1

WORKDIR /codepy
COPY requirements.txt /codepy/
RUN pip install -U wheel pip
RUN pip install -r requirements.txt
COPY . /codepy/

ENTRYPOINT [ "python", "streaming.py" ]
