package main

import "net/http"

var AllUsers = make(map[string]bool)

func HandleIdRequest(w http.ResponseWriter, req *http.Request) {
	w.WriteHeader(http.StatusOK)
	id := GenerateUntilNew(&AllUsers)
	w.Write([]byte(id))
	AllUsers[id] = true;
}

func HandleBrawlUrlRequest(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	_, exists := AllUsers[id]
	if id == "" || !exists {
		w.WriteHeader(http.StatusUnauthorized)
	}
	brawlId := GenerateUntilNew(&AllBrawls)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(brawlId))
}