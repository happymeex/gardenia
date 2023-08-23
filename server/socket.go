package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
}

// HandleWebSocket upgrades an HTTP request to a (non-blocking) WS connection and updates
// a file-scoped map tracking the websocket connections corresponding to each
// given request URL.
func HandleWebSocket(w http.ResponseWriter, req *http.Request) {
	url := req.URL.Path
	queryParams := req.URL.Query()
	uid := queryParams.Get("uid")
	isHost := queryParams.Get("isHost") == "true"

	b, exists := AllBrawls[url]
	if !exists {
		// only hosts can create a new brawl
		if !isHost {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Not found"))
			return
		}
		b = &BrawlNetwork{false, uid, make(map[string]*websocket.Conn)}
		AllBrawls[url] = b;
	}
	_, userExists := AllUsers[uid]
	if !userExists {
		w.WriteHeader(http.StatusUnauthorized)
	}

	// disallow multiple connections by the same user
	_, alreadyConnected := b.sockets[uid]
	if alreadyConnected {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Please join only once!"))
		return
	}

	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return
	}

	// add the user to the network and let everyone know
	b.sockets[uid] = conn;
	fmt.Println("currently connected:", b.sockets)
	b.sendIdList();

	for {
		_, rawMsg, err := conn.ReadMessage()
		if err != nil {
			delete(b.sockets, uid)
			if isHost || len(b.sockets) == 0 { // length condition extraneous but wtv
				// If the host errors, then close everything
				delete(AllBrawls, url)
				for _, other := range b.sockets {
					other.Close();
				}
			} else {
				b.sendIdList()
			}
			
			conn.Close(); // in case error wasn't a closure
			return;
		}
		msgParts := strings.SplitN(string(rawMsg), "_", 2)
		switch msgParts[0] {
			case "begin":
				if !b.active {
					fmt.Println("Creating new brawl")
					b.active = true;
					// notify all other clients, each then pings "begin" through its own socket connection
					for _, connection := range b.sockets {
						err := connection.WriteMessage(websocket.TextMessage,[]byte("activate"))
						if err != nil {
							fmt.Println(err)
						}
					}
					go b.StartBrawl()
				} else {
					fmt.Println("already began")
				}
				
			case "data":
				// pipe data through channel; StartBrawl func listens on other side for data to pipe to all clients
				UserInput <- msgParts[1]
			default:
				fmt.Println(msgParts[0])
		}
	}
}
