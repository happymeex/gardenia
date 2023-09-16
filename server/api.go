package main

import (
	"fmt"
	"net/http"
)

var AllUsers = make(map[string]bool)

func HandleAuth(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	queryId := queryParams.Get("id")
	var uuid string
	if queryId == "" {
		newId, err := CreateNewUser()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		uuid = newId
	} else {
		uuid = queryId
	}
	userData, err := GetUserSettings(uuid)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf(`{"id":"%s","name":"%s","musicOn":%t,"sfxOn":%t}`, uuid, userData.name, userData.musicOn, userData.sfxOn)))
	AllUsers[uuid] = true
}

func HandleBrawlUrlRequest(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	fmt.Println("id requesting brawl:", id)
	_, exists := AllUsers[id]
	if id == "" || !exists {
		fmt.Println("unauthorized")
		w.WriteHeader(http.StatusUnauthorized)
	} else {
		brawlId := GenerateUntilNew(&AllBrawls)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(brawlId))
	}
}
