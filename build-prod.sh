#!/bin/bash
# Production Build Script for YouTube Playlist Video Extractor

echo "🚀 Starting production build process..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "✅ Virtual environment activated"

# Install production dependencies
echo "📦 Installing production dependencies..."
pip install -r requirements-prod.txt

# Run security check
echo "🔒 Running security check..."
python manage.py check --deploy --settings=ytlinkEX.settings_prod

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --settings=ytlinkEX.settings_prod

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --settings=ytlinkEX.settings_prod

# Create logs directory if it doesn't exist
mkdir -p logs

# Test that everything works
echo "🧪 Testing production configuration..."
python manage.py check --settings=ytlinkEX.settings_prod

echo "✅ Production build completed successfully!"
echo ""
echo "🎉 Ready for deployment!"
echo "Next steps:"
echo "1. Set up your .env file with production variables"
echo "2. Configure your web server (Nginx/Apache)"
echo "3. Set up SSL certificates"
echo "4. Deploy using your preferred method"
echo ""
echo "📖 See DEPLOYMENT.md for detailed deployment instructions"
