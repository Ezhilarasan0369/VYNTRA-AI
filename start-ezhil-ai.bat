@echo off
title Ezhil AI

echo ============================
echo       Starting Ezhil AI
echo ============================

cd /d "C:\Users\ezhil\OneDrive\Desktop\Ezhil-AI\backend"

echo Starting Ollama...
start "" /min ollama serve

timeout /t 3 /nobreak >nul

echo Starting Ezhil AI Backend...
start "" /min python app.py

timeout /t 3 /nobreak >nul

echo Opening Ezhil AI...
start "" "C:\Users\ezhil\OneDrive\Desktop\Ezhil-AI\index.html"

exit