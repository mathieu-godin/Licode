package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
)

//helper methods
func clearState() {
	players = make(map[string]*Player)
}

func newServer() *httptest.Server {
	mux := http.NewServeMux()

	mux.HandleFunc("/registerPair", registerPair)
	mux.HandleFunc("/ws", wsEndpoint)

	//mock server
	return httptest.NewServer(mux)
}

func newWS(server *httptest.Server, t *testing.T) *websocket.Conn {
	//get ws equivalent url
	u := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws"
	log.Println(fmt.Sprintf("u: %s", u))

	//connect
	ws, _, err := websocket.DefaultDialer.Dial(u, nil)
	if err != nil {
		t.Fatalf("%v", err)
	}
	return ws
}

func mockRegPair(pair Pair, server *httptest.Server, t *testing.T) (int, string) {
	reqBody, err := json.Marshal(pair)
	if err != nil {
		t.Fatalf("%v", err)
	}

	res, err := http.Post(server.URL+"/registerPair", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer res.Body.Close()
	out, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("%v", err)
	}

	return res.StatusCode, string(out)
}

func regValidPair(pair Pair, server *httptest.Server, t *testing.T) {
	statusCode, out := mockRegPair(Pair{Id1: "id1", Id2: "id2"}, server, t)
	if statusCode != 200 || out != "" {
		t.Fatalf("Registration failed in TestConnection")
	}
}

func readMessage(ws *websocket.Conn, t *testing.T) (int64, any) {
	_, p, err := ws.ReadMessage()
	if err != nil {
		t.Fatalf("%v", err)
	}

	var serverMsg Msg
	err = json.Unmarshal(p, &serverMsg)
	if err != nil {
		t.Fatalf("%v", err)
	}

	data, ok := serverMsg.Data.(map[string]any)
	if !ok {
		t.Fatal(serverMsg)
	}
	typeAny, ok := data["Type"]
	if !ok {
		t.Fatal("No type in Data field")
	}
	typeF, ok := typeAny.(float64)
	if !ok {
		t.Fatal("Wrong type type in Data field")
	}

	typeI := int(typeF)

	switch serverMsg.Type {
	case Behaviour:
		start, ok := data["Start"].(bool)
		if !ok {
			t.Fatal("Wrong behaviour start type")
		}
		serverMsg.Data = BehaviourData{
			Type:  typeI,
			Start: start,
		}
		break
	case Information:
		info, ok := data["Info"].(string)
		if !ok {
			t.Fatal("Wrong info info type")
		}
		serverMsg.Data = InformationData{
			Type: typeI,
			Info: info,
		}
		break
	case FieldUpdate:
		newValue, ok := data["NewValue"].(string)
		if !ok {
			t.Fatal("Wrong field update NewValue type")
		}
		serverMsg.Data = FieldUpdateData{
			Type:     typeI,
			NewValue: newValue,
		}
		break
	default:
		t.Fatalf("Unknown Message Type %d", serverMsg.Type)
	}
	return serverMsg.Type, serverMsg.Data
}

func gameInit(t *testing.T) (*httptest.Server, *websocket.Conn, *websocket.Conn) {
	//clear player list, like server just started
	clearState()

	server := newServer()

	id1 := "id1"
	id2 := "id2"

	//register pair
	regValidPair(Pair{Id1: id1, Id2: id2}, server, t)

	//make a websocket connection
	ws1 := newWS(server, t)
	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, id1)))
	if err != nil {
		t.Fatalf("Failed to connect")
	}

	//make another
	ws2 := newWS(server, t)
	err = ws2.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, id2)))
	if err != nil {
		t.Fatalf("Failed to connect")
	}

	//read connection msgs
	readMessage(ws1, t)
	readMessage(ws2, t)

	return server, ws1, ws2
}

//super basic "test" tests so to speak
func TestAddPair(t *testing.T) {
	clearState()

	addPair(Pair{Id1: "id1", Id2: "id2"})
	if len(players) != 2 {
		t.Error("Valid Pair Not Added")
	}
}

func TestRemovePair(t *testing.T) {
	clearState()

	addPair(Pair{Id1: "id1", Id2: "id2"})
	if len(players) != 2 {
		t.Error("Valid Pair Not Added (in remove test)")
	}
	removePair("id1")
	if len(players) != 0 {
		t.Error("Pair Not Removed")
	}
}

type PairRegTest struct {
	Id1      string
	Id2      string
	expected bool
}

var pairRegTests []PairRegTest = []PairRegTest{
	{Id1: "id1", Id2: "id2", expected: true},
	{Id1: "id1", Id2: "id1", expected: false},
}

//test one-off pair registration (called by deno)
func TestRegisterPair(t *testing.T) {
	for i := 0; i < len(pairRegTests); i++ {
		clearState()

		server := newServer()
		defer server.Close()

		statusCode, out := mockRegPair(Pair{Id1: pairRegTests[i].Id1, Id2: pairRegTests[i].Id2}, server, t)
		if (statusCode != 200 || out != "") && pairRegTests[i].expected {
			t.Errorf("Registration Failed w status %d and output %s", statusCode, out)
		} else if statusCode == 200 && out == "" && !pairRegTests[i].expected {
			t.Errorf("Pair (%s, %s) incorrectly registered", pairRegTests[i].Id1, pairRegTests[i].Id2)
		}
	}
}

//test duplicate registration
func TestRegisterDup(t *testing.T) {
	clearState()

	server := newServer()
	defer server.Close()

	pair := Pair{
		Id1: "id1",
		Id2: "id2",
	}

	statusCode, out := mockRegPair(pair, server, t)

	if statusCode != 200 || out != "" {
		t.Fatalf("Failed to register: statusCode=%d, out=%s", statusCode, out)
	}

	statusCode, out = mockRegPair(pair, server, t)
	if statusCode != 200 || out != "" {
		t.Fatalf("Failed to reregister: statusCode=%d, out=%s", statusCode, out)
	}
}

//test one already registered
func TestOneAlreadyRegistered(t *testing.T) {
	clearState()

	server := newServer()
	defer server.Close()

	pair1 := Pair{
		Id1: "id1",
		Id2: "id2",
	}

	pair2 := Pair{
		Id1: "id1",
		Id2: "id3",
	}

	statusCode, out := mockRegPair(pair1, server, t)

	if statusCode != 200 || out != "" {
		t.Fatalf("Failed to register: statusCode=%d, out=%s", statusCode, out)
	}

	statusCode, out = mockRegPair(pair2, server, t)
	if statusCode != 405 || out == "" {
		t.Fatalf("Wrong error response: statusCode=%d, out=%s", statusCode, out)
	}
}

func TestBothAlreadyRegistered(t *testing.T) {
	clearState()

	server := newServer()
	defer server.Close()

	pair1 := Pair{
		Id1: "id1",
		Id2: "id2",
	}

	pair2 := Pair{
		Id1: "id3",
		Id2: "id4",
	}

	pair3 := Pair{
		Id1: "id1",
		Id2: "id3",
	}

	statusCode, out := mockRegPair(pair1, server, t)
	if statusCode != 200 || out != "" {
		t.Fatalf("Failed to register: statusCode=%d, out=%s", statusCode, out)
	}

	statusCode, out = mockRegPair(pair2, server, t)
	if statusCode != 200 || out != "" {
		t.Fatalf("Failed to register: statusCode=%d, out=%s", statusCode, out)
	}

	statusCode, out = mockRegPair(pair3, server, t)
	if statusCode != 405 || out == "" {
		t.Fatalf("Wrong error response: statusCode=%d, out=%s", statusCode, out)
	}
}

func TestRegBadBody(t *testing.T) {
	clearState()

	server := newServer()
	defer server.Close()

	res, err := http.Post(server.URL+"/registerPair", "application/json", bytes.NewBuffer([]byte("bad body")))
	if err != nil {
		t.Fatalf("%v", err)
	}
	defer res.Body.Close()
	_, err = ioutil.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("%v", err)
	}
	if res.StatusCode != 400 {
		t.Fatal("Wrong error response")
	}
}

func TestTooFewArgs(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(""))
	if err != nil {
		t.Fatal("Failed to write")
	}

	msgType, dataAny := readMessage(ws1, t)
	if msgType != Information {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Error || data.Info == "" {
		t.Fatalf("Wrong error response: type=%d, info=%s", data.Type, data.Info)
	}
}

func TestBagMessageType(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte("not a message"))
	if err != nil {
		t.Fatal("Failed to write")
	}

	msgType, dataAny := readMessage(ws1, t)
	if msgType != Information {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Error || data.Info == "" {
		t.Fatalf("Wrong error response: type=%d, info=%s", data.Type, data.Info)
	}
}

func TestNoId(t *testing.T) {
	clearState()

	server := newServer()
	defer server.Close()

	ws := newWS(server, t)
	err := ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(Win)))
	if err != nil {
		t.Fatal("Failed to write")
	}

	msgType, dataAny := readMessage(ws, t)
	if msgType != Information {
		t.Fatalf("Expected information got %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Error {
		t.Fatalf("Expected error got %d", msgType)
	}
	if data.Info == "" {
		t.Fatalf("Got empty error message")
	}
}

//test client connection process
func TestConnection(t *testing.T) {
	//clear player list, like server just started
	clearState()

	server := newServer()
	defer server.Close()

	//register pair
	regValidPair(Pair{Id1: "id1", Id2: "id2"}, server, t)

	//make a websocket connection
	ws := newWS(server, t)
	defer ws.Close()

	//send connection request (with id)
	if err := ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, "id1"))); err != nil {
		t.Fatalf("%v", err)
	}
	//read server's response
	msgType, dataAny := readMessage(ws, t)
	if msgType != Information {
		t.Fatalf("Wrong response type %d", msgType)
	}
	data, ok := dataAny.(InformationData)
	if !ok {
		t.Fatal("Wrong response data type")
	}
	if data.Type != Connection {
		t.Fatal("Wrong response data.type")
	}
	if data.Info != "" {
		t.Fatalf("Connection failed because %s", data.Info)
	}
}

func TestConnectionNoId(t *testing.T) {
	//clear player list, like server just started
	clearState()

	server := newServer()
	defer server.Close()

	//register pair
	regValidPair(Pair{Id1: "id1", Id2: "id2"}, server, t)

	//make a websocket connection
	ws := newWS(server, t)
	defer ws.Close()

	//send connection request (without id)
	if err := ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(ConnectionRequest))); err != nil {
		t.Fatalf("%v", err)
	}
	//read server's response
	msgType, dataAny := readMessage(ws, t)
	if msgType != Information {
		t.Fatalf("Expected info got %d", msgType)
	}
	data, _ := dataAny.(InformationData)

	if data.Type != Error {
		t.Fatalf("Expected error got %d", data.Type)
	}
	if data.Info == "" {
		t.Fatalf("Expected error message")
	}
}

func TestConnectNoReg(t *testing.T) {
	//clear player list, like server just started
	clearState()

	server := newServer()
	defer server.Close()

	//don't register pair

	//make a websocket connection
	ws := newWS(server, t)
	defer ws.Close()

	//send connection request (with id)
	if err := ws.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, "id1"))); err != nil {
		t.Fatalf("%v", err)
	}
	//read server's response
	msgType, dataAny := readMessage(ws, t)
	if msgType != Information {
		t.Fatalf("Expected info got %d", msgType)
	}
	data, _ := dataAny.(InformationData)

	if data.Type != Error {
		t.Fatalf("Expected error got %d", data.Type)
	}
	if data.Info == "" {
		t.Fatalf("Expected error message")
	}
}

func TestConnectionInbox(t *testing.T) {
	//clear player list, like server just started
	clearState()

	server := newServer()
	defer server.Close()

	id1 := "id1"
	id2 := "id2"

	//register pair
	regValidPair(Pair{Id1: id1, Id2: id2}, server, t)

	//make a websocket connection
	ws1 := newWS(server, t)
	defer ws1.Close()

	//send connection request (with id)
	if err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, id1))); err != nil {
		t.Fatalf("%v", err)
	}
	//read server's response
	msgType, dataAny := readMessage(ws1, t)
	if msgType != Information {
		t.Fatalf("Wrong response type %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Connection {
		t.Fatal("Wrong response data.type")
	}
	if data.Info != "" {
		t.Fatalf("Connection failed because %s", data.Info)
	}

	//send an update
	code := "this is some code"
	ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %d %s", GiveFieldUpdate, Code, code)))

	//make opponent
	ws2 := newWS(server, t)
	defer ws2.Close()

	//send connection request (with id)
	if err := ws2.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", ConnectionRequest, id2))); err != nil {
		t.Fatalf("%v", err)
	}

	//read connect confirmation and update from inbox
	for i := 0; i < 2; i++ {
		msgType, dataAny = readMessage(ws2, t)
		if msgType == Information {
			data, _ = dataAny.(InformationData)
			if data.Type != Connection {
				t.Fatal("Wrong response data.type")
			}
			if data.Info != "" {
				t.Fatalf("Connection failed because %s", data.Info)
			}
		} else if msgType == FieldUpdate {
			data, _ := dataAny.(FieldUpdateData)
			if data.Type != Code {
				t.Fatalf("Expected fieldupdate got %d", data.Type)
			}
			if data.NewValue != code {
				t.Fatalf("Expected %s got %s", code, data.NewValue)
			}
		} else {
			t.Fatalf("Expected info or connection got %d", msgType)
		}
	}
}

type FieldUpdateCase struct {
	Type  int
	Value string
}

var fieldUpdateCases []FieldUpdateCase = []FieldUpdateCase{
	{Type: Code, Value: "this is some code"},
	{Type: Input, Value: "this is some input"},
	{Type: TestCases, Value: "these are some test case results"},
}

func TestFieldUpdates(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	for i := 0; i < len(fieldUpdateCases); i++ {
		var u1 *websocket.Conn
		var u2 *websocket.Conn

		if i%2 == 0 {
			u1 = ws1
			u2 = ws2
		} else {
			u1 = ws2
			u2 = ws1
		}

		//user one sends a field update
		err := u1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %d %s", GiveFieldUpdate, fieldUpdateCases[i].Type, fieldUpdateCases[i].Value)))
		if err != nil {
			t.Fatalf("Failed to send field update")
		}

		//user two recieves a message
		msgType, dataAny := readMessage(u2, t)
		if msgType != FieldUpdate {
			t.Fatalf("Wrong response type %d", msgType)
		} //the message is a FieldUpdate

		data, _ := dataAny.(FieldUpdateData)

		if data.Type != fieldUpdateCases[i].Type {
			t.Fatalf("Wrong field type %d", data.Type)
		} //it is updating the right field

		if data.NewValue != fieldUpdateCases[i].Value {
			t.Fatalf("Wrong value %s", data.NewValue)
		} //it delivered the correct value
	}
}

func TestFieldUpdateOneArg(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(GiveFieldUpdate)))
	if err != nil {
		t.Fatal("Failed to write")
	}

	msgType, dataAny := readMessage(ws1, t)
	if msgType != Information {
		t.Fatalf("Expected info got %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Error {
		t.Fatalf("Expected error gor %d", data.Type)
	}
	if data.Info == "" {
		t.Fatal("Expected error message")
	}
}

func TestFieldUpdateInvalidType(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d not a field type", GiveFieldUpdate)))
	if err != nil {
		t.Fatal("Failed to write")
	}

	msgType, dataAny := readMessage(ws1, t)
	if msgType != Information {
		t.Fatalf("Expected info got %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Error {
		t.Fatalf("Expected error gor %d", data.Type)
	}
	if data.Info == "" {
		t.Fatal("Expected error message")
	}
}

//uncomment for about 5% more coverage, takes 30 seconds to complete
// this will take 15s
func TestPeek(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(StartPeeking)))
	if err != nil {
		t.Fatal("Failed to peek")
	}
	msgType, dataAny := readMessage(ws1, t)
	if msgType != Behaviour {
		t.Fatalf("Wrong message type %d", msgType)
	}

	data, _ := dataAny.(BehaviourData)

	if data.Type != Peek {
		t.Fatal("Wrong behaviour")
	}

	if data.Start {
		t.Fatal("Wrong instruction")
	}
}

//this will take 15s
func TestSlow(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(SlowOpponent)))
	if err != nil {
		t.Fatal("Failed to slow")
	}

	msgType, dataAny := readMessage(ws2, t)

	if msgType != Behaviour {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ := dataAny.(BehaviourData)

	//we should get a START TypeSlow message
	if data.Type != TypeSlow {
		t.Fatal("Not peek")
	}
	if !data.Start {
		t.Fatal("Wrong instruction")
	}

	msgType, dataAny = readMessage(ws2, t)

	if msgType != Behaviour {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ = dataAny.(BehaviourData)

	//we should get a STOP TypeSlow message
	if data.Type != TypeSlow {
		t.Fatal("Not peek")
	}
	if data.Start {
		t.Fatal("Wrong instruction")
	}
}

func TestSkip(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(Skip)))
	if err != nil {
		t.Fatal("Failed to skip")
	}
}

func TestWin(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprint(Win)))
	if err != nil {
		t.Fatal("Failed to win")
	}

	msgType, dataAny := readMessage(ws2, t)
	if msgType != Information {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ := dataAny.(InformationData)
	if data.Type != Loss || data.Info != "" {
		t.Fatalf("Wrong message: Type=%d Info=%s", data.Type, data.Info)
	}

	playersMU.Lock()
	numPlayers := len(players)
	playersMU.Unlock()

	if numPlayers != 0 {
		t.Fatalf("Too many players %d", numPlayers)
	}
}

func TestQuestionNum(t *testing.T) {
	server, ws1, ws2 := gameInit(t)
	defer server.Close()
	defer ws1.Close()
	defer ws2.Close()

	qNum := "2"

	err := ws1.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("%d %s", GiveQuestionNum, qNum)))
	if err != nil {
		t.Fatal("Failed to win")
	}

	msgType, dataAny := readMessage(ws2, t)
	if msgType != Information {
		t.Fatalf("Wrong message type %d", msgType)
	}
	data, _ := dataAny.(InformationData)

	if data.Type != QuestionNum {
		t.Fatalf("Wrong info type %d", data.Type)
	}
	if data.Info != qNum {
		t.Fatalf("Wrong question number")
	}
}

//test ideas

//registerPair with no body (cause fail on read)
//test already connected (<1%)
//test give missed updates (make server, reg, make ws1, send messages, make ws2, read messages)
