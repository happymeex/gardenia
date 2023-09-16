package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/joho/godotenv"
)

const PORT = "8080"

func main() {
	godotenv.Load() // load env vars from .env

	ConnectToDB()
	InitializeDB()

	var prodMode bool
	flag.BoolVar(&prodMode, "prod", false, "Specifies production mode")
	flag.Parse()

	if prodMode {
		fs := http.FileServer(http.Dir("./client/dist/assets/"))
		http.Handle("/assets/", http.StripPrefix("/assets/", fs))
		http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
			http.ServeFile(w, req, "./client/dist/index.html")
		})
	} else {
		viteDevServerURL, _ := url.Parse("http://localhost:5173")
		proxy := httputil.NewSingleHostReverseProxy(viteDevServerURL)
		http.Handle("/", proxy)
	}

	http.HandleFunc("/ws/", HandleWebSocket)
	http.HandleFunc("/new-brawl-id", HandleBrawlUrlRequest)
	http.HandleFunc("/auth", HandleAuth)
	http.HandleFunc("/update-setting", HandleUpdateSettings)
	fmt.Println("Listening on port:", PORT)
	http.ListenAndServe(":"+PORT, nil)
}
