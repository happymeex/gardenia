package main

import (
	"fmt"
	"net/http"
	"strconv"
)

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
}

// HandleUpdateSettings update's a user's settings. It expects three fields
// in the query: id, setting, and value.
func HandleUpdateSettings(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	setting := queryParams.Get("setting")
	if setting == "musicOn" || setting == "sfxOn" {
		value, err := strconv.ParseBool(queryParams.Get("value"))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		err = UpdateBooleanSetting(id, setting, value)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
}

func HandleBrawlUrlRequest(w http.ResponseWriter, req *http.Request) {
	queryParams := req.URL.Query()
	id := queryParams.Get("id")
	fmt.Println("id requesting brawl:", id)
	if id == "" {
		fmt.Println("unauthorized")
		w.WriteHeader(http.StatusUnauthorized)
	} else {
		brawlId := GenerateUntilNew(&AllBrawls)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(brawlId))
	}
}
