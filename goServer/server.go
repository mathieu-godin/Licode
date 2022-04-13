package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"
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
func makeCodeUpdate(code string) Msg {
	return makeMsg(CodeUpdate, true, code)
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
	id int

	//id of the player's opponent
	opponentId int

	//the player's connection
	conn *websocket.Conn

	//is this player peaking
	isPeeking bool
	//has this player received their first code update?
	//used so the 15 second timer doesn't start until the first update
	updated bool

	//queue of messages to be sent
	inbox []WrappedMsg
}

//Player ctor
func makePlayer(connected bool, id int, opponentId int, conn *websocket.Conn) Player {
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

//id to index for constant time mutable access
var idxOf = make(map[int]int)

//input to the /register method
//specifies two players that will
//compete
type Pair struct {
	id1 int
	id2 int
}

func addPair(pair Pair) {
	//save index of the first new player
	idxOf[pair.id1] = len(players)
	//make first new player
	players = append(players, makePlayer(false, pair.id1, pair.id2, nil))

	//same for second new player
	idxOf[pair.id2] = len(players)
	players = append(players, makePlayer(false, pair.id2, pair.id1, nil))
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
	err = json.Unmarshal(body, &pair)
	if err != nil {
		w.WriteHeader(400)
		log.Println(err)
		return
	}

	//make sure ids are distinct
	if pair.id1 == pair.id2 {
		w.WriteHeader(405)
		w.Write([]byte("Error: id1 and id2 must be distinct."))
		return
	}

	//see if players are already registered
	player1Idx, ok1 := idxOf[pair.id1]
	player2Idx, ok2 := idxOf[pair.id2]

	if !(ok1 || ok2) {
		//neither are registered, we're good
		w.WriteHeader(200)
	} else {
		w.WriteHeader(405)
		player1 := players[player1Idx]
		player2 := players[player2Idx]
		if ok1 && ok2 && player1.opponentId == pair.id2 && player2.opponentId == pair.id1 {
			//this pair is already registered
			w.Write([]byte("Error: Pair already registered."))
		} else if ok1 && ok2 {
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
func isRegistered(id int) bool {
	//commented for testing
	// _, ok := players[id]
	// return ok
	return true
}

func addMsg(id int, defMsgType int, msg Msg, callback Callback) {
	log.Println("delaying")
	players[idxOf[id]].inbox = append(players[idxOf[id]].inbox, wrapMsg(defMsgType, msg, callback))
}

//We detect a silent disconnect by failure to write
//	to a player's connection.
//This is a helper to put that logic in one place.
//It's minimal now, but various retry approaches might be needed.
//Returns true if the message was sent
//Returns false if the message was queued
func safeWrite(id int, defMsgType int, msg Msg, callback Callback, queueOnFail bool) bool {
	if players[idxOf[id]].conn == nil {
		players[idxOf[id]].connected = false
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

	err = players[idxOf[id]].conn.WriteMessage(defMsgType, data)
	if err != nil {
		players[idxOf[id]].connected = false
		players[idxOf[id]].conn = nil
		if queueOnFail {
			addMsg(id, defMsgType, msg, callback)
		}
		return false
	}

	callback()
	return true
}

func safeWrite2(id int, defMsgType int, msg Msg, queueOnFail bool) bool {
	return safeWrite(id, defMsgType, msg, func() {}, queueOnFail)
}

var nextId int = 0

//the "reader" that communicates with the
//websocket throughout its lifecycle
func reader(conn *websocket.Conn) {
	var id int
	var idSet bool = false

	log.Println(fmt.Sprintf("Top of reader %d", nextId))
	temp, _, _ := conn.ReadMessage()
	conn.WriteMessage(temp, []byte(fmt.Sprint(nextId)))
	nextId += 1
	//parse a command, do the thing
	for {
		//variables declared before gotos
		//I think they're fair
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
			id, err = strconv.Atoi(args[1])
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
			//ensure we know the player is connected
			players[idxOf[id]].connected = true
			//ensure their connection is up to date (i.e. not an invalid pointer
			//from a dropped connection.)
			players[idxOf[id]].conn = conn

			//give missed updates
			for i := 0; i < len(players[idxOf[id]].inbox); i += 1 {
				if safeWrite(id, players[idxOf[id]].inbox[i].defMsgType, players[idxOf[id]].inbox[i].msg, players[idxOf[id]].inbox[i].callback, false) {
					players[idxOf[id]].inbox = append(players[idxOf[id]].inbox[:i], players[idxOf[id]].inbox[i+1:]...)
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
			if players[opponentIdx].isPeeking {
				//recover code
				code := msg
				msgTypeStr := fmt.Sprint(msgType)
				i := 0
				//read white space
				for ; i < len(code) && code[i] == ' '; i += 1 {
				}
				//read msgType
				for j := 0; j < len(msgTypeStr) && (i+j) < len(code) && code[i+j] == msgTypeStr[j]; j += 1 {
				}
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
				codeUpdate := makeCodeUpdate(code)
				callback := func() {}
				//if this is the first update then we
				//want to wait until the update has been given...
				if !players[opponentId].updated {
					callback = func() {
						//mark that an update has been received
						players[opponentId].updated = true
						//after 15 seconds, tell the player to stop sending their code
						time.AfterFunc(15*time.Second, func() {
							players[opponentId].isPeeking = false
							safeWrite2(id, defMsgType, makePeek(true), true)
						})
					}
				}
				safeWrite(opponentId, defMsgType, codeUpdate, callback, true)
			} else {
				//if their opponent isn't peeking then just tell this player
				//to stop
				safeWrite2(id, defMsgType, makePeek(true), true)
			}
			break
		case Peek:
			//just mark that player is peeking
			players[idxOf[id]].isPeeking = true
			//tell the opponent to start sending updates (they are told to stop)
			//via callback in the CodeUpdate case so that their time doesn't start
			//until they actually receive a CodeUpdate
			safeWrite2(players[idxOf[id]].opponentId, defMsgType, makePeek(false), true)
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
			log.Println(fmt.Sprintf("Player %d is skipping", id))
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

//test method
//query response with r
//write response with w
//format write with fmt
//log on server with log
func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Home Page")
	log.Println("Home Page")
}

func setupRoutes() {
	http.HandleFunc("/", homePage)
	http.HandleFunc("/registerPair", registerPair)
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("Start server...")
	addPair(Pair{
		id1: 0,
		id2: 1,
	})
	setupRoutes()
	log.Fatal(http.ListenAndServe(":8080", nil))
}
