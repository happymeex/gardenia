package main

import (
	"fmt"
	"net/http"
)

var AllUsers = make(map[string]bool)

func HandleIdRequest(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	id := GenerateUntilNew(&AllUsers)
	w.Write([]byte(id))
	AllUsers[id] = true;
}

func HandleAuth(w http.ResponseWriter, req *http.Request) {
	// For now, I'm authenticating everything. TODO: real auth
	w.WriteHeader(http.StatusOK)
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	AllUsers[id] = true
}

func HandleBrawlUrlRequest(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	fmt.Println("id requesting brawl:", id)
	_, exists := AllUsers[id]
	if id == "" || !exists {
		w.WriteHeader(http.StatusUnauthorized)
	} else {
		brawlId := GenerateUntilNew(&AllBrawls)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(brawlId))
	}
}