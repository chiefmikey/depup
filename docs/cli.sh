#!/bin/bash
# depup CLI -- submits package requests through the GitHub issue pipeline
# Usage: curl -sL depup.dev/cli.sh | bash -s express
#    or: ./cli.sh express

REPO="chiefmikey/depup"
PKG="${1}"

if [ -z "$PKG" ]; then
  echo "Usage: depup <package-name>"
  echo "  e.g: depup express"
  echo "  e.g: depup @nestjs/core"
  exit 1
fi

FLAT=$(echo "$PKG" | sed 's/^@//;s/\//__/')

# Check if already published
echo "Checking @depup/$FLAT..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.npmjs.org/@depup/$FLAT")
if [ "$STATUS" = "200" ]; then
  VERSION=$(curl -s "https://registry.npmjs.org/@depup/$FLAT" | grep -o '"latest":"[^"]*"' | cut -d'"' -f4)
  echo "Already published: @depup/$FLAT@$VERSION"
  echo "npm install @depup/$FLAT"
  exit 0
fi

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "Install GitHub CLI (gh) to submit requests:"
  echo "  https://cli.github.com"
  echo ""
  echo "Or submit manually:"
  echo "  https://github.com/$REPO/issues/new?labels=package-request&title=Add+package:+$PKG"
  exit 1
fi

# Create issue via gh CLI
echo "Submitting package request for $PKG..."
ISSUE_URL=$(gh issue create \
  --repo "$REPO" \
  --title "Add package: $PKG" \
  --body "### Package Name
\`$PKG\`

### Reason
Submitted via CLI" \
  --label "package-request" 2>&1)

if [ $? -ne 0 ]; then
  echo "Failed to create issue. Make sure you're logged into gh."
  exit 1
fi

echo "Submitted: $ISSUE_URL"
echo "De Pup is processing..."

# Poll for result
ATTEMPTS=0
while [ $ATTEMPTS -lt 90 ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 5
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.npmjs.org/@depup/$FLAT")
  if [ "$STATUS" = "200" ]; then
    VERSION=$(curl -s "https://registry.npmjs.org/@depup/$FLAT" | grep -o '"latest":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "Published: @depup/$FLAT@$VERSION"
    echo "npm install @depup/$FLAT"
    exit 0
  fi
  ELAPSED=$((ATTEMPTS * 5))
  printf "\rWaiting... %d:%02d" $((ELAPSED / 60)) $((ELAPSED % 60))
done

echo ""
echo "Timed out. Check $ISSUE_URL for status."
exit 1
