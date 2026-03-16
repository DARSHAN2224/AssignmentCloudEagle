package com.example.githubreport.service;

import com.example.githubreport.model.GithubRepository;
import com.example.githubreport.model.GithubUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GithubService {

    private static final Logger logger = LoggerFactory.getLogger(GithubService.class);
    private final WebClient webClient;

    public GithubService(WebClient webClient) {
        this.webClient = webClient;
    }

    public Mono<Map<String, List<String>>> generateAccessReport(String organization) {
        logger.info("Starting access report generation for organization: {}", organization);

        return getRepositories(organization)
                .flatMap(repo -> getCollaborators(organization, repo.getName())
                        .map(user -> Map.entry(user.getLogin(), repo.getFullName())))
                .collectList()
                .map(entries -> entries.stream()
                        .collect(Collectors.groupingBy(
                                Map.Entry::getKey,
                                Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                        )))
                .doOnSuccess(report -> logger.info("Finished report generation with {} users.", report.size()))
                .doOnError(e -> logger.error("Error generating report for {}: {}", organization, e.getMessage()));
    }

    private Flux<GithubRepository> getRepositories(String organization) {
        return fetchPaginated(String.format("/orgs/%s/repos?per_page=100", organization), GithubRepository.class)
                .doOnSubscribe(s -> logger.debug("Fetching repositories for {}", organization));
    }

    private Flux<GithubUser> getCollaborators(String organization, String repository) {
        return fetchPaginated(String.format("/repos/%s/%s/collaborators?per_page=100", organization, repository), GithubUser.class)
                .doOnSubscribe(s -> logger.debug("Fetching collaborators for {}/{}", organization, repository))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    if (ex.getStatusCode().value() == 404 || ex.getStatusCode().value() == 403) {
                        logger.warn("Skipping collaborators for {}/{}: {}", organization, repository, ex.getMessage());
                        return Flux.empty();
                    }
                    return Flux.error(ex);
                });
    }

    private <T> Flux<T> fetchPaginated(String url, Class<T> responseType) {
        return fetchPage(url, responseType).expand(
                tuple -> {
                    String nextUrl = getNextPageUrl(tuple.getT2());
                    if (nextUrl != null) {
                        return fetchPage(nextUrl, responseType);
                    }
                    return Mono.empty();
                }
        ).flatMapIterable(reactor.util.function.Tuple2::getT1);
    }

    private <T> Mono<reactor.util.function.Tuple2<List<T>, String>> fetchPage(String url, Class<T> responseType) {
        return webClient.get()
                .uri(url)
                .exchangeToMono(response -> {
                    if (response.statusCode().isError()) {
                        return response.createException().flatMap(Mono::error);
                    }
                    
                    String linkHeader = response.headers().header("Link").stream().findFirst().orElse("");
                    
                    return response.bodyToFlux(responseType)
                            .collectList()
                            .map(list -> reactor.util.function.Tuples.of(list, linkHeader));
                })
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                        .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests || 
                                             throwable instanceof WebClientResponseException.ServiceUnavailable));
    }

    private String getNextPageUrl(String linkHeader) {
        if (linkHeader == null || linkHeader.isEmpty()) {
            return null;
        }
        
        String[] links = linkHeader.split(",");
        for (String link : links) {
            if (link.contains("rel=\"next\"")) {
                int start = link.indexOf("<");
                int end = link.indexOf(">");
                if (start != -1 && end != -1) {
                    return link.substring(start + 1, end).replace("https://api.github.com", ""); // Return relative link
                }
            }
        }
        return null;
    }
}
