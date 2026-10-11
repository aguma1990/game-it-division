@echo off
cd /d "%~dp0"
echo Neko Bank IT berjalan di http://localhost:8080
echo Tutup jendela ini untuk menghentikan game.
start "" http://localhost:8080
python -m http.server 8080 || py -m http.server 8080
