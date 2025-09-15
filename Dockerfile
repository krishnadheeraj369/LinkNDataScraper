FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Chromium + deps
RUN python -m playwright install --with-deps chromium

# Copy app source (including templates + static)
COPY . .

# Expose Flask port
EXPOSE 9090

# Run Flask directly (simpler, same as local)
#CMD ["python", "webscraping.py"]

CMD ["gunicorn", "--bind", "0.0.0.0:9090", "webscraping:app"]