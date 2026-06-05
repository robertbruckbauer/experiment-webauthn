package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HelloControllerTest {

    private final HelloController controller = new HelloController();

    @Test
    void shouldReturnHelloWorldMessage() {
        assertThat(controller.hello()).containsEntry("message", "Hello World");
    }
}
