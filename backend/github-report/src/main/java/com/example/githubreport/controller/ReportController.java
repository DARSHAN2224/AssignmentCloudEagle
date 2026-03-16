package com.example.githubreport.controller;

import com.example.githubreport.service.GithubService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);
    private final GithubService githubService;

    public ReportController(GithubService githubService) {
        this.githubService = githubService;
    }

    @GetMapping("/org/{organization}")
    public Mono<ResponseEntity<Object>> getAccessReport(@PathVariable String organization) {
        return githubService.generateAccessReport(organization)
                .map(report -> (Object) report)
                .map(ResponseEntity::ok)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    logger.error("GitHub API error for org '{}': {} {}", organization, ex.getStatusCode(), ex.getMessage());
                    String message = switch (ex.getStatusCode().value()) {
                        case 401 -> "Unauthorized: GitHub token is missing or invalid. Set the GITHUB_TOKEN environment variable.";
                        case 403 -> "Forbidden: GitHub token lacks required permissions (read:org, repo), or rate limit exceeded.";
                        case 404 -> "Not Found: Organization '" + organization + "' does not exist or is not accessible.";
                        default  -> "GitHub API error: " + ex.getMessage();
                    };
                    return Mono.just(ResponseEntity.status(ex.getStatusCode())
                                                   .body((Object) Map.of("error", message)));
                })
                .onErrorResume(e -> {
                    logger.error("Unexpected error for org '{}': {}", organization, e.getMessage(), e);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                   .body((Object) Map.of("error", "Internal error: " + e.getMessage())));
                });
    }
}
