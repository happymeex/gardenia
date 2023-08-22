package main

import (
	"fmt"
	"strings"

	"github.com/gorilla/websocket"
)


var AllBrawls map[string]*BrawlNetwork = make(map[string]*BrawlNetwork)
type InputData = string
var UserInput = make(chan InputData, 1000)


type BrawlNetwork struct {
	active bool
	// Maps socket pointers to the ID of the corresponding user
	sockets map[*websocket.Conn]string
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

func (b *BrawlNetwork) StartBrawl() {
	for {
		data, ok := <- UserInput
		// If channel or all sockets have closed, terminate
		if !ok || len(b.sockets) == 0 {
			return
		}
		for conn := range b.sockets {
			err := conn.WriteMessage(websocket.TextMessage, []byte(data))
			if err != nil {
				fmt.Println(err)
			}
		}
	}
}