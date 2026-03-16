package com.example.githubreport.model;

import lombok.Data;

@Data
public class GithubUser {
    private String login;
    private Long id;
    private String type;
}
