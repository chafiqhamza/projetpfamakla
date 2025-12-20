package com.example.nutrition.client;

import com.example.nutrition.dto.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/profile")
    UserProfileResponse getUserProfile(@RequestHeader("X-User-Id") Long userId);
}

