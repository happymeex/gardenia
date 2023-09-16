package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load() // load env vars from .env
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	err := ConnectToDB()
	if err == nil {
		err = InitializeDB()
		if err != nil {
			fmt.Println("Failed to connect to DB:", err)
		}
	} else {
		fmt.Println("Failed to connect to DB:", err)
		return
	}

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
	fmt.Println("Listening on port:", port)
	http.ListenAndServe(":"+port, nil)
}
