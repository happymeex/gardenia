package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
)

var RedisClient *redis.Client
var ctx = context.Background()

// ConnectToRedis opens a Redis connection and sets eviction policy to volatile-lru.
	redisURI := os.Getenv("REDIS_URL")
	opt, err := redis.ParseURL(redisURI)
	if err != nil {
		return err
	}
	RedisClient = redis.NewClient(opt)
	err = RedisClient.Ping(ctx).Err()
	if err != nil {
		return err
	}
	err = RedisClient.ConfigSet(ctx, "maxmemory-policy", "volatile-lru").Err()
	if err != nil {
		return err
	}
	fmt.Println("Connected to Redis")
	return nil
}

// RedisAddUser stores a user (id, name) in Redis for 72 hours.
	err := RedisClient.Set(ctx, id, name, 72*time.Hour).Err()
	return err
}

// NameFromId returns the name for a given id. If not in Redis, checks DB. Returns error if not found.
	name, err := RedisClient.Get(ctx, id).Result()
	if err == redis.Nil {
		// if not in Redis cache, check DB
		userData, err := GetUserSettings(id)
		if err != nil {
			return "", err
		}
		name = userData.name
	}
	return name, nil
}
