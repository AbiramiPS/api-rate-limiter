package com.api_rate_limiter.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.api_rate_limiter.service.RedisService;
@RestController
@RequestMapping("/admin/redis")
public class RedisTestController {
    @Autowired
    private RedisService redisService;

    @GetMapping("/save")
    public String save() {
    redisService.saveValue("name", 100);
    return "Saved";
}

@GetMapping("/get")
public Integer get() {
    return redisService.getValue("name");
}

@GetMapping("/increment")
public Long increment() {

    return redisService.increment("client:C001");

}
}
