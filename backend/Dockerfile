# ==============================================================================
# Optimized Dockerfile using pre-built JAR
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S finsentinel && adduser -S finsentinel -G finsentinel

COPY target/finsentinel-backend-1.0.0.jar ./app.jar

ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:MaxRAMPercentage=75.0 -Dspring.threads.virtual.enabled=true"

USER finsentinel:finsentinel

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
