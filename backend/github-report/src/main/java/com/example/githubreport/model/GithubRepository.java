package com.example.githubreport.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GithubRepository {
    private Long id;
    private String name;
    
    @JsonProperty("full_name")
    private String fullName;
    
    @JsonProperty("private")
    private boolean isPrivate;
}
