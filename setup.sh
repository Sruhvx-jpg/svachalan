#!/bin/bash

if [ ! -f ".env" ]; then
  echo ".env file does not exist."
  cp .env.example .env
else
  echo ".env file exists. ✅"
fi

for dir in apps/* packages/*; do
  if [ -d "$dir" ]; then
    target="$dir/.env"

    rm -f "$target"

    ln -s ../../.env "$target"

    echo "Linked $target -> ../../.env"
  fi
done