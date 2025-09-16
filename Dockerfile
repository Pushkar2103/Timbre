# Use a modern, stable version of Python (3.11)
FROM python:3.11-slim-bookworm

# Set the working directory
WORKDIR /app

# (Networking Fix) Force the use of HTTPS for all software repositories.
RUN sed -i 's/http:/https:/g' /etc/apt/sources.list.d/debian.sources

# Install system-level dependencies like ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libsndfile1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .

# **THE FIX**: Added --timeout=600 to give pip 10 minutes to download large files.
RUN pip install --no-cache-dir --timeout=600 -r requirements.txt

# Copy the application code into the container, including the templates
COPY ./src /app/src

# Expose the port that the Flask app will run on
EXPOSE 8080

# The command to run when the container starts
CMD ["python", "src/app.py"]

