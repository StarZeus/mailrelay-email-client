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
  echo "Version $VERSION already tagged. Exiting."
  
  # Bump version in package.json
  npm version --no-git-tag-version $VERSION
  git add package.json
  git commit -m "Bump version to $VERSION"
  git push origin main
fi

# Create and push tag
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# Create GitHub release if gh CLI is available
if command -v gh &> /dev/null; then
  gh release create "v$VERSION" --generate-notes
else
  echo "GitHub CLI not found. Please create release manually at:"
  echo "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\).git/\1/')/releases/new"
fi 