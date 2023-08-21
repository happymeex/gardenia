package main

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

const fps = 80.0

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
		for data := range UserInput {
			for conn := range b.sockets {
				err := conn.WriteMessage(websocket.TextMessage, []byte(data))
				if err != nil {
					fmt.Println(err)
				}
			}
		}	
		// If all sockets have closed, terminate
		if len(b.sockets) == 0 {
			return
		}
		time.After(time.Second / fps)
	}
}