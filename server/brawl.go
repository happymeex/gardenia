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
	// Indicates whether the brawl has started.
	active bool
	// Id of the user who created the brawl.
	hostId string
	// Maps user ids to their corresponding socket
	sockets map[string]*websocket.Conn
}

// getIdList returns a stringified object whose fields are user ids of the
// users in the brawl and whose values are the corresponding names.
func (b BrawlNetwork) getIdList() string {
	var ids []string
	for id := range b.sockets {
		name, err := NameFromId(id)
		if err != nil {
			panic(err)
		}
		ids = append(ids, fmt.Sprintf("\"%s\":\"%s\"", id, name))
	}
	return fmt.Sprintf("{%s}", strings.Join(ids, ","))
}

// sendIdList sends a message over each socket connection of the BrawlNetwork,
// notifying each client of the most updated list of user ids that have joined.
// The "list" takes the form of a map with user ids as keys and names as values.
func (b BrawlNetwork) sendIdList() {
	msg := []byte(fmt.Sprintf("idList_%s", b.getIdList()))
	for _, connection := range b.sockets {
		err := connection.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			fmt.Println(err)
		}
	}
}

func (b *BrawlNetwork) StartBrawl() {
	for {
		data, ok := <-UserInput
		// If channel or all sockets have closed, terminate
		if !ok || len(b.sockets) == 0 {
			return
		}
		for _, conn := range b.sockets {
			err := conn.WriteMessage(websocket.TextMessage, []byte(data))
			if err != nil {
				fmt.Println(err)
			}
		}
	}
}
