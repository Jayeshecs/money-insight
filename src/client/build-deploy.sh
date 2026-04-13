#!/bin/sh

echo "Building client..."
ng build --configuration production

if [ $? -ne 0 ]; then
    echo "Build failed. Please check the error messages above."
    exit 1
fi

echo "Deploying to Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "Deployment successful!"
else
    echo "Deployment failed. Please check the error messages above."
fi