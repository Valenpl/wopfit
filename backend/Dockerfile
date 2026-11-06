# Imagen del backend para publicarlo (ver README, "Publicar").
# 1) compila con Maven y Java 17   2) corre solo el .jar sobre una JRE 17
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/wopfit-api-*.jar app.jar
# MySQL + perfil de entrega (ddl-auto=validate). Los secretos llegan por variables de entorno.
ENV SPRING_PROFILES_ACTIVE=mysql,prod
# Que Java use hasta el 75 % de la memoria del contenedor: así entra en los 512 MB del plan gratis de Render.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
