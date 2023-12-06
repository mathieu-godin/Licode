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

/*
SERVER replies with Msg as json
Message Types:
	Behaviour
		TypeSlow		- tell player to type slow
		Peek			- tell player to stop peeking
	Information
		Connection		- tell player if connection succeed
		Error			- give player an error message
		Loss			- inform player their opponent has won
		QuestionNum		- inform player their opponent is on a new question
	FieldUpdate
		Code			- give player their opponent's code editor input
		Input			- etc.
		Output
		StandardOutput
*/

/*
CLIENT sends message type and args i.e. <MsgType> <args[1]> <args[2]> ...
Message Types:
	ConnectionRequest		- indicates player wants to join the game with sid args[1]
	StartPeeking			- player using peek wildcard
	SlowOpponent			- player using typing speed wildcard
	Skip					- player is skipping a test case
	GiveFieldUpdate			- player is sending a field update (code, input, ...)
		same subtypes as SERVER FieldUpdate
	GiveQuestionNum			- indicates the player is now solving question args[1]
	Win						- the player has solved the final question
*/

//Outgoing Message Types
const (
	Behaviour   int64 = 0
	Information       = 1
	FieldUpdate       = 2
)

//the only struct sent to clients
type Msg struct {
	Type int64 `json:"Type"`
	Data any   `json:"Data"`
}

//Behaviours
const (
	TypeSlow = 0
	Peek     = 1
)

type BehaviourData struct {
	Type  int  `json:"Type"`
	Start bool `json:"Start"`
}

func makeBehaviourMsg(bType int, start bool) Msg {
	return Msg{
		Type: Behaviour,
		Data: BehaviourData{
			Type:  bType,
			Start: start,
		},
	}
}

//Information
const (
	Connection  = 0
	Error       = 1
	Loss        = 2
	QuestionNum = 3
)

type InformationData struct {
	Type int    `json:"Type"`
	Info string `json:"Info"`
}

func makeInformationMsg(iType int, info string) Msg {
	return Msg{
		Type: Information,
		Data: InformationData{
			Type: iType,
			Info: info,
		},
	}
}

//FieldUpdate
const (
	Code           = 0
	Input          = 1
	Output         = 2
	StandardOutput = 3
	StandardError  = 4
	TestCases      = 5
)

type FieldUpdateData struct {
	Type     int    `json:"Type"`
	NewValue string `json:"NewValue"`
}

func makeFieldUpdateMsg(fType int, newValue string) Msg {
	return Msg{
		Type: FieldUpdate,
		Data: FieldUpdateData{
			Type:     fType,
			NewValue: newValue,
		},
	}
}

//incoming messages
//int64 because of strconv.Parse return type

const (
	ConnectionRequest int64 = 0
	StartPeeking            = 1
	SlowOpponent            = 2
	Skip                    = 3
	GiveFieldUpdate         = 4
	GiveQuestionNum         = 5
	Win                     = 6
)

//ConnectMsg ctor
func makeConnectMsg(err string) Msg {
	return makeInformationMsg(Connection, err)
}

//Peek ctor
func makePeekMsg() Msg {
	return makeBehaviourMsg(Peek, false)
}

//Slow ctor
func makeSlowMsg(start bool) Msg {
	return makeBehaviourMsg(TypeSlow, start)
}

//CodeUpdate ctor
func makeCodeUpdateMsg(code string) Msg {
	return makeFieldUpdateMsg(Code, code)
}

//Error ctor
func makeErrorMsg(what string) Msg {
	return makeInformationMsg(Error, what)
}

//Loss ctor
func makeLossMsg() Msg {
	return makeInformationMsg(Loss, "")
}

//QuestionNum ctor
func makeQuestionNumMsg(questionNum string) Msg {
	return makeInformationMsg(QuestionNum, questionNum)
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
	opponent *Player

	//the player's connection
	conn *websocket.Conn

	//queue of messages to be sent
	inbox []WrappedMsg

	mu sync.Mutex
}

//list to store players
var players = make(map[string]*Player)
var playersMU sync.Mutex

//Player ctor
func newPlayer(connected bool, id string) *Player {
	return &Player{
		connected: connected,
		id:        id,
		opponent:  nil,
		conn:      nil,
	}
}

//input to the /register method
//specifies two players that will
//compete
type Pair struct {
	Id1 string `json:"Id1"`
	Id2 string `json:"Id2"`
}

func addPair(pair Pair) {
	playersMU.Lock()

	//make first new player
	players[pair.Id1] = newPlayer(false, pair.Id1)
	//same for second
	players[pair.Id2] = newPlayer(false, pair.Id2)

	//link players together
	players[pair.Id1].opponent = players[pair.Id2]
	players[pair.Id2].opponent = players[pair.Id1]

	log.Println(fmt.Sprintf("registered pair: %s, %s", pair.Id1, pair.Id2))

	playersMU.Unlock()
}
func removePair(id string) {
	playersMU.Lock()

	//remove player
	player, ok := players[id]
	if ok {
		if player.opponent != nil {
			opponent, ok := players[player.opponent.id]
			if ok && opponent.opponent.id == id {
				delete(players, player.opponent.id)
			} else {
				//error?
			}
		}

		log.Println("Removing Player")
		delete(players, id)
	}

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
	player1, ok1 := players[pair.Id1]
	player2, ok2 := players[pair.Id2]

	if !(ok1 || ok2) {
		//neither are registered
		w.WriteHeader(200)
	} else if ok1 && ok2 && player1.opponent != nil && player2.opponent != nil &&
		player1.opponent.id == pair.Id2 && player2.opponent.id == pair.Id1 {
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
	_, ok := players[id]
	return ok
}

func addMsg(id string, defMsgType int, msg Msg, callback Callback) {
	log.Println("delaying")
	players[id].inbox = append(players[id].inbox, wrapMsg(defMsgType, msg, callback))
}

//We detect a silent disconnect by failure to write
//	to a player's connection.
//This is a helper to put that logic in one place.
//It's minimal now, but various retry approaches might be needed.
//Returns true if the message was sent
//Returns false if the message was queued
func safeWrite(id string, defMsgType int, msg Msg, callback Callback, queueOnFail bool) bool {
	if players[id].conn == nil {
		players[id].mu.Lock()
		players[id].connected = false
		if queueOnFail {
			addMsg(id, defMsgType, msg, callback)
		}
		players[id].mu.Unlock()
		return false
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Println(err)
		//really shouldn't happen
		return false
	}

	players[id].mu.Lock()
	err = players[id].conn.WriteMessage(defMsgType, data)
	players[id].mu.Unlock()
	if err != nil {
		players[id].mu.Lock()
		players[id].connected = false
		players[id].conn = nil
		players[id].mu.Unlock()
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
		var player *Player
		var ok bool

		//read msg
		defMsgType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			errMsg, err = json.Marshal(makeErrorMsg("Unknown"))
			goto GeneralError
		}

		//split into args
		msg = string(p)
		args = strings.Fields(msg)
		if len(args) < 1 {
			log.Println("Too few args")
			errMsg, err = json.Marshal(makeErrorMsg("Too few args"))
			goto GeneralError
		}

		//log.Println(msg)

		//parse the message type
		msgType, err = strconv.ParseInt(args[0], 10, 32)
		if err != nil {
			log.Println(err)
			errMsg, err = json.Marshal(makeErrorMsg("Invalid message type"))
			goto GeneralError
		}

		if !idSet && msgType != Connection {
			log.Println("Need an id")
			errMsg, err = json.Marshal(makeErrorMsg("Need an id"))
			goto GeneralError
		}

		//check to see if the player has been unregistered
		player, ok = players[id]
		if idSet && (!ok || player == nil || player.opponent == nil) {
			log.Println("unreged player intercepted")
			return
		}

		//handle dependent on message type
		switch msgType {
		case ConnectionRequest:
			var connMsg Msg
			var data []byte

			//ensure there's an id
			if len(args) < 2 {
				log.Println("Need an id")
				connMsg = makeErrorMsg("Need an id")
				goto ConnectionFailed
			}

			id = args[1]

			//ensure the player has been registered
			if !isRegistered(id) {
				log.Println("Error: not registered.")
				connMsg = makeErrorMsg("id not registered")
				goto ConnectionFailed
			}

			if players[id].connected {
				//maybe want to error, but what if they silently disconnected?
				log.Println("Already connected")
			}
			players[id].mu.Lock()
			//ensure we know the player is connected
			players[id].connected = true
			//ensure their connection is up to date (i.e. not an invalid pointer
			//from a dropped connection.)
			players[id].conn = conn
			players[id].mu.Unlock()

			//give missed updates
			for len(players[id].inbox) > 0 {
				log.Println("from inbox")
				if safeWrite(id, players[id].inbox[0].defMsgType, players[id].inbox[0].msg, players[id].inbox[0].callback, false) {
					players[id].mu.Lock()
					players[id].inbox = players[id].inbox[1:]
					players[id].mu.Unlock()
				} else {
					goto ConnectionDropped
				}
			}

			//try to give a positive acknowledgment
			connMsg = makeConnectMsg("")
			safeWrite2(id, defMsgType, connMsg, false)
			idSet = true
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
		case GiveFieldUpdate:
			var i int = -1
			var j int = -1
			var newValue string = ""
			var msgTypeStr string = ""
			var fieldTypeStr string = ""
			var field int64 = -1
			var errMsg Msg = makeErrorMsg("")

			if len(args) < 2 {
				if idSet {
					errMsg = makeErrorMsg("too few args")
					goto FieldUpdateFailed
				} else {
					data, err := json.Marshal(makeErrorMsg("too few args"))
					if err == nil {
						log.Println("No id field update error")
						conn.WriteMessage(defMsgType, data)
					}
				}
				break
			}
			field, err = strconv.ParseInt(args[1], 10, 32)
			if err != nil {
				log.Println(err)
				errMsg = makeErrorMsg("Invalid field type")
				goto FieldUpdateFailed
			}

			newValue = msg
			//recover newValue
			msgTypeStr = fmt.Sprint(msgType)
			fieldTypeStr = fmt.Sprint(field)
			i = 0
			//read white space
			for ; i < len(newValue) && newValue[i] == ' '; i += 1 {
			}
			//read msgType
			j = 0
			for j < len(msgTypeStr) && (i+j) < len(newValue) && newValue[i+j] == msgTypeStr[j] {
				j += 1
			}
			i += j
			//read white space
			for ; i < len(newValue) && newValue[i] == ' '; i += 1 {
			}
			//read field type
			j = 0
			for j < len(fieldTypeStr) && (i+j) < len(newValue) && newValue[i+j] == fieldTypeStr[j] {
				j += 1
			}
			i += j
			//read white space
			for ; i < len(newValue) && newValue[i] == ' '; i += 1 {
			}
			//read newValue
			if i < len(newValue) {
				log.Println(fmt.Sprintf("Taking %s from %s", newValue[i:], newValue))
				newValue = newValue[i:]
			} else {
				log.Println(fmt.Sprintf("Nothing left in %s", newValue))
				newValue = ""
			}

			safeWrite2(players[id].opponent.id, defMsgType, makeFieldUpdateMsg(int(field), newValue), true)
			break
		FieldUpdateFailed:
			safeWrite2(id, defMsgType, errMsg, false)
			break
		case StartPeeking:
			//after 15 seconds, tell the player to stop sending their code
			time.AfterFunc(15*time.Second, func() {
				log.Println("telling " + id + " to stop peeking")
				safeWrite2(id, defMsgType, makePeekMsg(), true)
			})
			break
		case SlowOpponent:
			opponentId := players[id].opponent.id
			//after 15 seconds, tell the opponent to stop
			//typing slowly
			callback := func() {
				time.AfterFunc(15*time.Second, func() {
					safeWrite2(opponentId, defMsgType, makeSlowMsg(false), true)
				})
			}
			//tell opponent to start typing slowly
			safeWrite(opponentId, defMsgType, makeSlowMsg(true), callback, true)
			break
		case Skip:
			//dumby response
			log.Println(fmt.Sprintf("Player %s is skipping", id))
			break
		case Win:
			//this player is indicating that they won,
			//give their opponent the bad news
			log.Println(fmt.Sprintf("Player %s won!", id))
			opponentId := players[id].opponent.id
			//make callback to unregister pair after giving the bad news
			callback := func() {
				//unregister
				removePair(id)
			}
			safeWrite(opponentId, defMsgType, makeLossMsg(), callback, true)
			break
		case GiveQuestionNum:
			//this player is on the next question, inform their opponent
			log.Println(fmt.Sprintf("Player %s is on question %s", id, args[1]))
			opponentId := players[id].opponent.id
			safeWrite2(opponentId, defMsgType, makeQuestionNumMsg(args[1]), true)
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
	http.HandleFunc("/homePage", homePage)
	http.HandleFunc("/registerPair", registerPair)
	http.HandleFunc("/ws", wsEndpoint)
}

func main() {
	fmt.Println("Start server...")
	setupRoutes()
	log.Fatal(http.ListenAndServe(":5000", nil))
}
