package main

import (
	"fmt"
	"net/http"
)

func handleRoot(w http.ResponseWriter, req *http.Request) {
	fmt.Fprint(w, "hello")
}

func main(){
	fmt.Println("hello world")
	http.HandleFunc("/", handleRoot)
	http.ListenAndServe(":8080", nil)
}