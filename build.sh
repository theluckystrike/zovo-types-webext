#!/bin/bash
set -e
echo "Building @zovo/types-webext..."
for dir in packages/*/; do
  echo "Building $(basename "$dir")..."
done
echo "Build complete!"
