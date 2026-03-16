package com.example.githubreport.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${github.api.url}")
    private String githubApiUrl;

    @Value("${github.api.token:}")
    private String githubToken;

    @Bean
    public WebClient githubWebClient() {
        WebClient.Builder builder = WebClient.builder()
                .baseUrl(githubApiUrl)
                .defaultHeader(HttpHeaders.ACCEPT, "application/vnd.github.v3+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28");

        if (githubToken != null && !githubToken.isEmpty()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + githubToken);
        }

        return builder.build();
    }
}
