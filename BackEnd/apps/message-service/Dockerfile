FROM mcr.microsoft.com/dotnet/sdk:9.0

WORKDIR /app

RUN apt-get update && \
    apt-get install -y dos2unix && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 50054

COPY apps/message-service/entrypoint.sh /entrypoint.sh

RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]