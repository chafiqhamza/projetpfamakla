FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /build/target/*-SNAPSHOT.jar /app/app.jar
EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]

