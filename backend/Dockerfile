FROM gradle:8-jdk17

WORKDIR /app

# Copy all files
COPY . .

# Expose port
EXPOSE 8080

# Run with Gradle (development mode)
CMD ["gradle", "run", "--no-daemon"]
