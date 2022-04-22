package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

//Message Types
//int64 because of strconv.ParseInt return type
const (
	MsgTypeBegin int64 = 0
	Connection         = 1
	CodeUpdate         = 2
	Peek               = 3
	Slow               = 4
	Skip               = 5
	Error              = 6
	MsgTypeEnd         = 7
)
const AlwaysSendCodeUpdates = true

//the only struct sent to clients
type Msg struct {
	MsgType int64  `json:"MsgType"`
	Ok      bool   `json:"Ok"`
	What    string `json:"What"`
}

//Msg ctor
func makeMsg(MsgType int64, Ok bool, What string) Msg {
	return Msg{
		MsgType: MsgType,
		Ok:      Ok,
		What:    What,
	}
}

//TODO UPDATE --- PROBABLY OUTDATED
//SERVER, replies with Msg as json
//connected/not connected:  			type=Connection, ok=>connected, !ok=>not connected, what= ok ? id : error message
//start giving code updates,
//	stop giving code updates: 			type=Peek, !ok=>start, ok=>stop, what=""
//start slow typing, stop slow typing: 	type=Slow, !ok=>start, ok->stop, what=""
//code update: 							type=CodeUpdate, ok=true, what=code
//error: 								type=Error, ok=false, what=error msg

//CLIENT, sends message type and args
//attempt connect:  type=Connection, args[0] = id
//start peeking:    type=Peek (maybe take time as an arg?)
//slow opponent:    type=Slow
//skip test case:   type=Skip
//send code update: type=CodeUpdate, rest = code

//I think input structs relating to gameplay
//should be in deno.
//A very simple interpretter should work
//	on this side and it would be difficult
//	to maintain structs here and there.

//ConnectMsg ctor
func makeConnectMsg(confirmed bool, reason string) Msg {
	return makeMsg(Connection, confirmed, reason)
}

//Peek ctor
func makePeek(stop bool) Msg {
	return makeMsg(Peek, stop, "")
}

//Slow ctor
func makeSlow(stop bool) Msg {
	return makeMsg(Slow, stop, "")
}

//CodeUpdate ctor
func makeCodeUpdate(code string, ok bool) Msg {
	return makeMsg(CodeUpdate, ok, code)
}

//Error ctor
func makeError(what string) Msg {
	return makeMsg(Error, false, what)
}

//a msg to be stored in a player's inbox
//used to store messages that were supposed to
//be sent while they were disconnected
type Callback func()
type WrappedMsg struct {
	defMsgType int
	msg        Msg
	callback   Callback
}

//WrappedMsg ctor
func wrapMsg(defMsgType int, msg Msg, callback Callback) WrappedMsg {
	return WrappedMsg{
		defMsgType: defMsgType,
		msg:        msg,
		callback:   callback,
	}
}

//WrappedMsg ctor 2 (default callback)
func wrapMsg2(defMsgType int, msg Msg) WrappedMsg {
	return WrappedMsg{
		defMsgType: defMsgType,
		msg:        msg,
		callback:   func() {},
	}
}

//the state of a player
type Player struct {
	//has the player arrived at the code editor
	connected bool

	//id provided by matchmaking
	id string

	//id of the player's opponent
	opponentId string

	//the player's connection
	conn *websocket.Conn

	//is this player peaking
	isPeeking bool
	//has this player received their first code update?
	//used so the 15 second timer doesn't start until the first update
	updated bool

	//queue of messages to be sent
	inbox []WrappedMsg

	mu sync.Mutex
}

//Player ctor
func makePlayer(connected bool, id string, opponentId string, conn *websocket.Conn) Player {
	return Player{
		connected:  connected,
		id:         id,
		opponentId: opponentId,
		conn:       conn,
		isPeeking:  false,
		updated:    false,
	}
}

//list to store players
var players = []Player{}
var playersMU sync.Mutex

//id to index for constant time mutable access
var idxOf = make(map[string]int)

//input to the /register method
//specifies two players that will
//compete
type Pair struct {
	Id1 string `json:"Id1"`
	Id2 string `json:"Id2"`
}

func addPair(pair Pair) {
	playersMU.Lock()

	//save index of the first new player
	idxOf[pair.Id1] = len(players)
	//same for second new player
	idxOf[pair.Id2] = len(players) + 1

	for i := 0; i < len(players); i += 1 {
		players[i].mu.Lock()
	}

	//make first new player
	players = append(players, makePlayer(false, pair.Id1, pair.Id2, nil))
	//same for second
	players = append(players, makePlayer(false, pair.Id2, pair.Id1, nil))

	for i := 0; i < len(players)-2; i += 1 {
		players[i].mu.Unlock()
	}

	log.Println(fmt.Sprintf("registered pair: %s, %s", pair.Id1, pair.Id2))

	playersMU.Unlock()
}

//register a pair of players who will compete
func registerPair(w http.ResponseWriter, r *http.Request) {
	//need to give 404 or something unless it's from licode
	log.Println(r.Header.Values("Origin"))
	//if r.Header.Values("Origin")[0] != "licode.io" {
	//	w.WriteHeader(404)
	//}

	//try to read body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(400)
		log.Println(err)
		return
	}

	//parse body
	var pair Pair
	log.Println(fmt.Sprintf("parsing body: %s", body))
	err = json.Unmarshal([]byte(body), &pair)
	if err != nil {
		w.WriteHeader(400)
		log.Println(err)
		return
	}

	log.Println(fmt.Sprintf("attempting to register %s, %s", pair.Id1, pair.Id2))

	//make sure ids are distinct
	if pair.Id1 == pair.Id2 {
		w.WriteHeader(405)
		w.Write([]byte("Error: Id1 and Id2 must be distinct."))
		return
	}

	//see if players are already registered
	player1Idx, ok1 := idxOf[pair.Id1]
	player2Idx, ok2 := idxOf[pair.Id2]

	if !(ok1 || ok2) {
		//neither are registered
		w.WriteHeader(200)
	} else if ok1 && ok2 && players[player1Idx].opponentId == pair.Id2 && players[player2Idx].opponentId == pair.Id1 {
		//this is a duplicate, it's fine but we don't want to add it again
		w.WriteHeader(200)
		return
	} else {
		w.WriteHeader(405)
		if ok1 && ok2 {
			//one of the players has a different opponent
			w.Write([]byte("Error: At least one player has a different partner."))
		} else {
			//one player is registered, one isn't
			w.Write([]byte("Error: One player already registered."))
		}
		return
	}

	addPair(pair)
}

//helper to check if the map
//contains id
func isRegistered(id string) bool {
	//commented for testing
	_, ok := idxOf[id]
	return ok
	//return true
}

func addMsg(id string, defMsgType int, msg Msg, callback Callback) {
	log.Println("delaying")
	players[idxOf[id]].inbox = append(players[idxOf[id]].inbox, wrapMsg(defMsgType, msg, callback))
}

//We detect a silent disconnect by failure to write
//	to a player's connection.
//This is a helper to put that logic in one place.
//It's minimal now, but various retry approaches might be needed.
//Returns true if the message was sent
//Returns false if the message was queued
func safeWrite(id string, defMsgType int, msg Msg, callback Callback, queueOnFail bool) bool {
	if players[idxOf[id]].conn == nil {
		players[idxOf[id]].mu.Lock()
		players[idxOf[id]].connected = false
		players[idxOf[id]].mu.Unlock()
		if queueOnFail {
			addMsg(id, defMsgType, msg, callback)
		}
		return false
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Println(err)
		//really shouldn't happen
		return false
	}

	players[idxOf[id]].mu.Lock()
	err = players[idxOf[id]].conn.WriteMessage(defMsgType, data)
	players[idxOf[id]].mu.Unlock()
	if err != nil {
		players[idxOf[id]].mu.Lock()
		players[idxOf[id]].connected = false
		players[idxOf[id]].conn = nil
		players[idxOf[id]].mu.Unlock()
		if queueOnFail {
			addMsg(id, defMsgType, msg, callback)
		}
		return false
	}

	callback()
	return true
}

func safeWrite2(id string, defMsgType int, msg Msg, queueOnFail bool) bool {
	return safeWrite(id, defMsgType, msg, func() {}, queueOnFail)
}

//the "reader" that communicates with the
//websocket throughout its lifecycle
func reader(conn *websocket.Conn) {
	var id string
	var idSet bool = false

	//parse a command, do the thing
	for {
		//variables declared before gotos
		var errMsg []byte
		var msgType int64
		var msg string
		var args []string

		//read msg
		defMsgType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			errMsg, err = json.Marshal(makeError("Unknown"))
			goto GeneralError
		}

		//split into args
		msg = string(p)
		args = strings.Fields(msg)
		if len(args) < 1 {
			log.Println("Too few args")
			errMsg, err = json.Marshal(makeError("Too few args"))
			goto GeneralError
		}

		log.Println(msg)

		//parse the message type
		msgType, err = strconv.ParseInt(args[0], 10, 32)
		if err != nil {
			log.Println(err)
			errMsg, err = json.Marshal(makeError("Invalid message type"))
			goto GeneralError
		}

		if !idSet && msgType != Connection {
			log.Println("Need an id")
			errMsg, err = json.Marshal(makeError("Need an id"))
			goto GeneralError
		}

		//handle dependent on message type
		switch msgType {
		case Connection:
			var connMsg Msg
			var data []byte

			//ensure there's an id
			if len(args) < 2 {
				log.Println("Need an id")
				connMsg = makeConnectMsg(false, "Need an id")
				goto ConnectionFailed
			}

			//parse the id
			id = args[1]
			if err != nil {
				log.Println(err)
				connMsg = makeConnectMsg(false, "Invalid id")
				goto ConnectionFailed
			}
			idSet = true

			//ensure the player has been registered
			if !isRegistered(id) {
				log.Println("Error: not registered.")
				connMsg = makeConnectMsg(false, "id not registered")
				goto ConnectionFailed
			}

			if players[idxOf[id]].connected {
				//maybe want to error, but what if they silently disconnected?
				log.Println("Already connected")
			}
			players[idxOf[id]].mu.Lock()
			//ensure we know the player is connected
			players[idxOf[id]].connected = true
			//ensure their connection is up to date (i.e. not an invalid pointer
			//from a dropped connection.)
			players[idxOf[id]].conn = conn
			players[idxOf[id]].mu.Unlock()

			//give missed updates
			for i := 0; i < len(players[idxOf[id]].inbox); i += 1 {
				if safeWrite(id, players[idxOf[id]].inbox[i].defMsgType, players[idxOf[id]].inbox[i].msg, players[idxOf[id]].inbox[i].callback, false) {
					players[idxOf[id]].mu.Lock()
					players[idxOf[id]].inbox = append(players[idxOf[id]].inbox[:i], players[idxOf[id]].inbox[i+1:]...)
					players[idxOf[id]].mu.Unlock()
				} else {
					idSet = false
					goto ConnectionDropped
				}
			}

			//try to give a positive acknowledgment
			connMsg = makeConnectMsg(true, fmt.Sprint(id))
			safeWrite2(id, defMsgType, connMsg, false)
			break
		ConnectionFailed:
			if idSet {
				safeWrite2(id, defMsgType, connMsg, false)
			} else {
				data, err = json.Marshal(connMsg)
				if err == nil {
					log.Println("No id connection error")
					conn.WriteMessage(defMsgType, data)
				}
			}
		ConnectionDropped:
			break
		case CodeUpdate:
			opponentId := players[idxOf[id]].opponentId
			opponentIdx := idxOf[opponentId]
			if players[opponentIdx].isPeeking || AlwaysSendCodeUpdates {
				//recover code
				code := msg
				msgTypeStr := fmt.Sprint(msgType)
				i := 0
				//read white space
				for ; i < len(code) && code[i] == ' '; i += 1 {
				}
				//read msgType
				j := 0
				for j < len(msgTypeStr) && (i+j) < len(code) && code[i+j] == msgTypeStr[j] {
					j += 1
				}
				i += j
				//read white space
				for ; i < len(code) && code[i] == ' '; i += 1 {
				}
				//read code
				if i < len(code) {
					code = code[i:]
				} else {
					code = ""
				}
				//package the code in a msg
				codeUpdate := makeCodeUpdate(code, true)
				callback := func() {}
				//if this is the first update then we
				//want to wait until the update has been given...
				if !players[idxOf[opponentId]].updated {
					callback = func() {
						//mark that an update has been received
						players[idxOf[opponentId]].updated = true
						//after 15 seconds, tell the player to stop sending their code
						time.AfterFunc(15*time.Second, func() {
							log.Println("in initial code update callback")
							players[idxOf[opponentId]].isPeeking = false
							safeWrite2(opponentId, defMsgType, makePeek(true), true)
							safeWrite2(id, defMsgType, makeCodeUpdate("E", false), true)
						})
					}
				}
				safeWrite(opponentId, defMsgType, codeUpdate, callback, true)
			} else {
				//if their opponent isn't peeking and we are not always sending updates
				//then just tell this player to stop
				safeWrite2(id, defMsgType, makeCodeUpdate("E", false), true)
			}
			break
		case Peek:
			//just mark that player is peeking
			players[idxOf[id]].mu.Lock()
			players[idxOf[id]].isPeeking = true
			players[idxOf[id]].updated = false
			players[idxOf[id]].mu.Unlock()
			//tell the opponent to start sending updates (they are told to stop)
			//via callback in the CodeUpdate case so that their time doesn't start
			//until they actually receive a CodeUpdate
			safeWrite2(players[idxOf[id]].opponentId, defMsgType, makeCodeUpdate("B", false), true)
			break
		case Slow:
			opponentId := players[idxOf[id]].opponentId
			//after 15 seconds, tell the opponent to stop
			//typing slowly
			callback := func() {
				time.AfterFunc(15*time.Second, func() {
					safeWrite2(opponentId, defMsgType, makeSlow(true), true)
				})
			}
			//tell opponent to start typing slowly
			safeWrite(opponentId, defMsgType, makeSlow(false), callback, true)
			break
		case Skip:
			//dumby response
			log.Println(fmt.Sprintf("Player %s is skipping", id))
			break
		default:
			//error
			log.Println("Invalid cmd")
			break
		}
		continue

	GeneralError:
		if err != nil {
			log.Println(err)
		}
		log.Println("general error")
		conn.WriteMessage(defMsgType, errMsg)
		break
	}
}

//maybe do diagnostics to adjust these values
//I believe we want the usage of each to be roughly
//50% at all times
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func wsEndpoint(w http.ResponseWriter, r *http.Request) {
	//dumby cors checker
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
	}

	log.Println("Client Connected on Web Socket")
	reader(ws)
}

// //test method
// //query response with r
// //write response with w
// //format write with fmt
// //log on server with log
// func homePage(w http.ResponseWriter, r *http.Request) {
// 	fmt.Fprintf(w, "Home Page")
// 	log.Println("Home Page")
// }

func setupRoutes() {
	// http.HandleFunc("/", homePage)
	http.HandleFunc("/registerPair", registerPair)
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("Start server...")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
