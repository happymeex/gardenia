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
	url := req.URL.String()
	conn, err := upgrader.Upgrade(w, req, nil)
	if err != nil {
		return
	}
	//defer conn.Close()

	b, exists := AllBrawls[url]
	if !exists {
		b = &BrawlNetwork{false, make(map[*websocket.Conn]string)}
		AllBrawls[url] = b;
	}
	for {
		_, rawMsg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("connection closed")
			delete(b.sockets, conn)
			if len(b.sockets) == 0 {
				delete(AllBrawls, url)
			} else if len(b.sockets) == 1{
				b.sendIdList()
				//for other := range b.sockets {
				//	err := other.WriteMessage(websocket.TextMessage, []byte("false"))
				//	if err != nil {
				//		fmt.Println(err)
				//	}
				//}

			}
			conn.Close();
			return;
		}
		msgParts := strings.Split(string(rawMsg), "_")
		switch msgParts[0] {
			case "ready": // ready_userId
				fmt.Println("uid:", msgParts[1])
				fmt.Println("existing connections:", *b)
				b.sockets[conn] = msgParts[1]; // track user id
				if len(b.sockets) > 1 {
					b.sendIdList()
					//for connection := range b.sockets {
					//	err := connection.WriteMessage(websocket.TextMessage, []byte("true"))
					//	if err != nil {
					//		fmt.Println(err)
					//	}
					//}
				}
			case "begin":
				if !b.active {
					fmt.Println("Creating new brawl")
					b.active = true;
					// notify all other clients, each then pings "begin" through its own socket connection
					for connection := range b.sockets {
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
				fmt.Println("got data:", msgParts[1])
				UserInput <- msgParts[1]
			default:
				fmt.Println(msgParts[0])
		}
	}
}

func (b BrawlNetwork) getIdList() string {
	var ids []string
	for _, id := range b.sockets {
		ids = append(ids, fmt.Sprintf("\"%s\"", id))
	}
	return fmt.Sprintf("[%s]", strings.Join(ids, ","))
}

// sendIdList sends a message over each socket connection of the BrawlNetwork,
// notifying each client of the most updated list of user ids that have joined.
func (b BrawlNetwork) sendIdList() {
	msg := []byte(fmt.Sprintf("idList_%s", b.getIdList()))
	for connection := range b.sockets {
		err := connection.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			fmt.Println(err)
		}
	}
}
