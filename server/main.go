package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
}

const PORT = "8080"

func handleWebSocket(w http.ResponseWriter, req *http.Request) {
	fmt.Println("ws handler called!")
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}
		fmt.Println(string(msg))
		if string(msg) == "done" {
			return
		}
	}
}

func main(){
	var prodMode bool
	flag.BoolVar(&prodMode, "prod", false, "Specifies production mode")
	flag.Parse()

	if prodMode {
		fs := http.FileServer(http.Dir("./client/dist/assets/"))
		http.Handle("/assets/", http.StripPrefix("/assets/", fs))
		http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request){
			http.ServeFile(w, req, "./client/dist/index.html")
		})
	} else {
		viteDevServerURL, _ := url.Parse("http://localhost:5173")
		proxy := httputil.NewSingleHostReverseProxy(viteDevServerURL)
		http.Handle("/", proxy)
	}

	http.HandleFunc("/ws", handleWebSocket)
	fmt.Println("Listening on port:", PORT)
	http.ListenAndServe(":" + PORT, nil)
}