package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)
var connections map[string]map[*websocket.Conn]bool = make(map[string]map[*websocket.Conn]bool)
var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
}

func HandleWebSocket(w http.ResponseWriter, req *http.Request) {
	url := req.URL.String()
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("connection closed")
			conns, _ := connections[url]
			delete(conns, conn)
			if len(conns) == 0 {
				delete(connections, url)
			} else if len(conns) == 1{
				for other := range conns {
					err := other.WriteMessage(websocket.TextMessage, []byte("false"))
					if err != nil {
						fmt.Println(err)
					}
				}

			}
			return;
		}
		if string(msg) == "ready" {
			if err != nil {
				fmt.Println(err)
			}
			conns, ok := connections[url]
			if !ok {
				conns = make(map[*websocket.Conn]bool)
				connections[url] = conns
			}
			fmt.Println("existing connections:", conns)
			conns[conn] = true;
			if len(conns) > 1 {
				for connection := range conns {
					err := connection.WriteMessage(websocket.TextMessage, []byte("true"))
					if err != nil {
						fmt.Println(err)
					}
				}
			}
		}
	}
}