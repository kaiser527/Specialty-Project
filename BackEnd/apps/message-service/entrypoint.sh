#!/bin/bash
set -e

echo "Checking Entity Framework Tools..."

if ! command -v dotnet-ef &> /dev/null; then
    echo "Installing dotnet-ef..."
    dotnet tool install --global dotnet-ef --version 9.0.0
else
    echo "dotnet-ef already installed"
fi

export PATH="$PATH:$HOME/.dotnet/tools"

echo "Waiting for SQL Server to be ready..."

until dotnet ef dbcontext info --project apps/message-service/message-service.csproj > /dev/null 2>&1; do
    echo "SQL Server is starting up... retrying in 5 seconds"
    sleep 5
done

echo "Checking for pending migrations..."

PENDING_MIGRATIONS=$(dotnet ef migrations list \
    --project apps/message-service/message-service.csproj \
    --no-build | tail -n 1)

if [[ "$PENDING_MIGRATIONS" == *"(Pending)"* ]]; then
    echo "Applying pending migrations..."
    dotnet ef database update --project apps/message-service/message-service.csproj
else
    echo "Database is already up to date"
fi

echo "Starting application with Hot Reload..."
exec dotnet watch run \
    --project apps/message-service/message-service.csproj \
    --urls "http://+:50054"