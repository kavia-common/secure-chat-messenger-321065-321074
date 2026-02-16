#!/bin/bash
cd /home/kavia/workspace/code-generation/secure-chat-messenger-321065-321074/messenger_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

