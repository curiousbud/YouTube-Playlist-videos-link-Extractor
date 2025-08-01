@echo off
REM Production Build Script for YouTube Playlist Video Extractor (Windows)

echo 🚀 Starting production build process...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated

REM Install production dependencies
echo 📦 Installing production dependencies...
pip install -r requirements-prod.txt

REM Run security check
echo 🔒 Running security check...
python manage.py check --deploy --settings=ytlinkEX.settings_prod

REM Collect static files
echo 📁 Collecting static files...
python manage.py collectstatic --noinput --settings=ytlinkEX.settings_prod

REM Run migrations
echo 🗄️ Running database migrations...
python manage.py migrate --settings=ytlinkEX.settings_prod

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Test that everything works
echo 🧪 Testing production configuration...
python manage.py check --settings=ytlinkEX.settings_prod

echo ✅ Production build completed successfully!
echo.
echo 🎉 Ready for deployment!
echo Next steps:
echo 1. Set up your .env file with production variables
echo 2. Configure your web server (IIS/Apache/Nginx)
echo 3. Set up SSL certificates
echo 4. Deploy using your preferred method
echo.
echo 📖 See DEPLOYMENT.md for detailed deployment instructions

pause
