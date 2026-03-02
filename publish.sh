#!/bin/bash
set -e
echo "Publishing @zovo/types-webext packages..."
for dir in packages/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Publishing $(basename "$dir")..."
  fi
done
echo "All packages published!"
