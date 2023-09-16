package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
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

	sendErrorMessage := func(msg string) {
		conn, err := upgrader.Upgrade(w, req, nil)
		if err != nil {
			return
		}
		conn.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("error_%s", msg)))
		conn.Close()
	}

	b, exists := AllBrawls[url]
	if !exists {
		// disallow creation of new brawls by users not designated as hosts
		if !isHost {
			sendErrorMessage("The requested brawl does not exist!")
			return
		}
		b = &BrawlNetwork{false, uid, make(map[string]*websocket.Conn)}
		AllBrawls[url] = b
	}

	if b.active {
		sendErrorMessage("The requested brawl is already in progress!")
		return
	}

	// disallow unauthorized users
	//_, userExists := AllUsers[uid]
	//if !userExists {
	//	sendErrorMessage("You seem to be an unauthorized user. Refresh the page?")
	//}

	// disallow multiple connections by the same user
	_, alreadyConnected := b.sockets[uid]
	if alreadyConnected {
		sendErrorMessage("You have already joined this brawl!")
		return
	}

	// cap at 3 players
	if len(b.sockets) == 3 {
		sendErrorMessage("This brawl is already full!")
		return
	}

	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		conn.Close()
		return
	}
	conn.WriteMessage(websocket.TextMessage, []byte("validate"))

	// add the user to the network and let everyone know
	b.sockets[uid] = conn
	fmt.Println("currently connected:", b.sockets)
	b.sendIdList()

	for {
		_, rawMsg, err := conn.ReadMessage()
		if err != nil {
			delete(b.sockets, uid)
			if isHost && !b.active {
				// host left before starting, so close all sockets
				delete(AllBrawls, url)
				for _, other := range b.sockets {
					sendErrorMessage("The host aborted the game.")
					other.Close()
				}
			} else {
				b.sendIdList()
			}

			conn.Close() // in case error wasn't a closure
			return
		}
		msgParts := strings.SplitN(string(rawMsg), "_", 2)
		switch msgParts[0] {
		case "begin":
			if !b.active {
				fmt.Println("Creating new brawl")
				b.active = true
				// notify all other clients, each then pings "begin" through its own socket connection
				for _, connection := range b.sockets {
					err := connection.WriteMessage(websocket.TextMessage, []byte("activate"))
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
