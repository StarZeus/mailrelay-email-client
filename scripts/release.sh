#!/bin/bash

# Exit on error
set -e

# Ensure we're on main and up-to-date
git checkout main
git pull origin main

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Check if the version is already tagged
if git tag -l "v$VERSION" | grep -q "v$VERSION"; then
  echo "Version $VERSION already tagged. Bumping version..."
  # Bump minor version
  VERSION=$(node -p "require('./package.json').version")
  VERSION=$(echo $VERSION | awk -F. '{print $1"."$2+1".0"}')
  
  # Bump version in package.json
  npm version $VERSION
  git add package.json
  git commit -m "Bump version to $VERSION"
  git push origin main
  git push origin "v$VERSION"
fi
# Create and push tag

# Create GitHub release if gh CLI is available
if command -v gh &> /dev/null; then
  gh release create "v$VERSION" --generate-notes
else
  echo "GitHub CLI not found. Please create release manually at:"
  echo "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\).git/\1/')/releases/new"
fi 