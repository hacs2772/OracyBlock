package com.oracyblock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class OracyBlockApplication {
    public static void main(String[] args) {
        SpringApplication.run(OracyBlockApplication.class, args);
    }
}
