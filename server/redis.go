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

// Opens a connection to a Redis DB with a volatile-lru eviction policy.
func ConnectToRedis() error {
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

// RedisAddUser adds an (id, name) pair to the Redis database.
func RedisAddUser(id, name string) error {
	err := RedisClient.Set(ctx, id, name, 72*time.Hour).Err()
	return err
}

// Gets the name correspondin to an id. Non-nil error if the id is invalid.
func NameFromId(id string) (string, error) {
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
