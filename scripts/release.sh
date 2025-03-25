#!/bin/bash

# Exit on error
set -e

# Ensure we're on main and up-to-date
git checkout main
git pull origin main

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Function to validate semver
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Invalid version format. Expected x.y.z"
        exit 1
    fi
}

# Function to bump version
bump_version() {
    local version=$1
    echo $(echo $version | awk -F. '{print $1"."$2+1".0"}')
}

# Validate current version
validate_version "$CURRENT_VERSION"

# Check if the version is already tagged
if git tag -l "v$CURRENT_VERSION" | grep -q "v$CURRENT_VERSION"; then
    echo "Version v$CURRENT_VERSION already exists. Bumping version..."
    NEW_VERSION=$(bump_version "$CURRENT_VERSION")
    validate_version "$NEW_VERSION"
    
    # Update version in package.json
    npm version $NEW_VERSION --no-git-tag-version
    
    # Update version in other configuration files
    sed -i '' "s/$CURRENT_VERSION/$NEW_VERSION/g" hosting/docker/docker-compose.yml
    sed -i '' "s/$CURRENT_VERSION/$NEW_VERSION/g" hosting/kubernetes/mailrelay/chart.yaml
    sed -i '' "s/$CURRENT_VERSION/$NEW_VERSION/g" hosting/kubernetes/mailrelay/values.yaml
    
    # Commit changes
    git add package.json hosting/docker/docker-compose.yml hosting/kubernetes/mailrelay/chart.yaml hosting/kubernetes/mailrelay/values.yaml
    git commit -m "chore: bump version to $NEW_VERSION"
    git push origin main
    
    VERSION=$NEW_VERSION
else
    VERSION=$CURRENT_VERSION
fi

# Create and push tag
echo "Creating tag v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# Create GitHub release
if command -v gh &> /dev/null; then
    echo "Creating GitHub release v$VERSION"
    gh release create "v$VERSION" --generate-notes
else
    echo "GitHub CLI not found. Please create release manually at:"
    echo "https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\).git/\1/')/releases/new"
fi

echo "Release v$VERSION completed successfully!" 