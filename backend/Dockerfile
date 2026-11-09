# ==============================================================================
# Multi-Stage Dockerfile for FinSentinel AI Backend (Spring Boot 3 + Java 21)
# ==============================================================================

# Stage 1: Build JAR using Maven & Eclipse Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy sources and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runner
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S finsentinel && adduser -S finsentinel -G finsentinel

# Copy built JAR from builder stage
COPY --from=builder /app/target/finsentinel-backend-1.0.0.jar ./app.jar

ENV JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -XX:MaxRAMPercentage=75.0 -Dspring.threads.virtual.enabled=true"

USER finsentinel:finsentinel

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
