package com.example.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class TestcontainersSmokeTest {

    @Container
    static GenericContainer<?> smokeContainer = new GenericContainer<>("alpine:3.20")
        .withCommand("sh", "-c", "sleep 60");

    @Test
    void containerStarts() {
        assertThat(smokeContainer.isRunning()).isTrue();
    }
}
