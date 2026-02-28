#!/bin/bash
# Local dev setup: creates environment files from templates.
# Run once after cloning the repo.

ENV_DIR="src/client/src/environments"

if [ ! -f "$ENV_DIR/environment.ts" ]; then
    cp "$ENV_DIR/environment.ts.example" "$ENV_DIR/environment.ts"
    echo "Created environment.ts -- fill in your GOOGLE_CLIENT_ID."
else
    echo "environment.ts already exists, skipping."
fi

if [ ! -f "$ENV_DIR/environment.prod.ts" ]; then
    cp "$ENV_DIR/environment.prod.ts.example" "$ENV_DIR/environment.prod.ts"
    echo "Created environment.prod.ts -- fill in your GOOGLE_CLIENT_ID."
else
    echo "environment.prod.ts already exists, skipping."
fi

echo ""
echo "IMPORTANT: Edit the generated files and replace YOUR_GOOGLE_CLIENT_ID."
echo "NEVER commit environment.ts or environment.prod.ts to git."
