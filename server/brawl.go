package main

import (
	"fmt"

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