#!/bin/bash

# Name of the output directory
DEMO_DIR=balatro_agent_demo

# List of local repo folders to include
REPOS=(
  "../balatro/balatro_gym"
  "../balatro/balatrobot"
  ../balatro/"balatrobotlanding"
  "../balatro/client"
  "../balatro/cursed_time"
)

echo "Copying repositories into $DEMO_DIR/..."

for repo in "${REPOS[@]}"
do
  if [ -d "$repo" ]; then
    echo "Copying $repo..."
    cp -R "$repo" "./"
    rm -rf "./$repo/.git"
  else
    echo "Warning: $repo not found!"
  fi
done

echo "✅ Done. Clean demo bundle is in $DEMO_DIR.zip"
