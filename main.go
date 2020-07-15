package main

import (
	"fmt"
	"io"
	"time"
	"net/http"
	"golang.org/x/net/websocket"
	"github.com/fhs/gompd/mpd"
)

func streamproxy(w http.ResponseWriter, req *http.Request) {
	resp, _ := http.Get("http://192.168.2.3:8000/mpd.ogg")
	buf := make([]byte, 327680)

	defer resp.Body.Close()
	w.WriteHeader(resp.StatusCode)
	//io.Copy(w, resp.Body)
	io.CopyBuffer(w, resp.Body, buf)
}

func ctrlsocket(ws *websocket.Conn) {
	mpdc, _ := mpd.Dial("tcp", "192.168.2.3:6600")
	mpdw, _ := mpd.NewWatcher("tcp", ":6600", "")

	fmt.Println("mpd dial")

	c := make(chan map[string]interface{})
	go ctrlevents(c, mpdw)
	go responder(c, ws)
	
	for {
		query := make(map[string]interface{})
		resp := make(map[string]interface{})

		websocket.JSON.Receive(ws, &query)
		if len(query) == 0 { continue }

		fmt.Println(query)

		switch query["act"] {
			case "cursong":
				cursong, _ := mpdc.CurrentSong()
				resp["act"] = query["act"]
				resp["cursong"] = cursong
			case "status":
				status, _ := mpdc.Status()
				resp["act"] = query["act"]
				resp["status"] = status
			case "plinfo":
				info, _ := mpdc.PlaylistInfo(-1,-1)
				resp["act"] = "plinfo"
				resp["info"] = info
			case "keepalive":
				resp["act"] = query["act"]
				mpdc.Ping()
			case "seek":
				duration, _:= time.ParseDuration(query["time"].(string))
				mpdc.SeekCur(duration, false)
				continue
			case "prev":
				mpdc.Previous()
				continue
			case "play":
				mpdc.Play(-1)
				continue
			case "pause":
				continue 
			case "stop":
				mpdc.Stop()
				continue
			case "next":
				mpdc.Next()
				continue
			case "shuffle":
				mpdc.Shuffle(-1,0)
				continue
			case "repeat":
				continue
			default:
				continue
		}
		//fmt.Println(resp);
		c <- resp
	}
}

func ctrlevents(c chan map[string]interface{}, w *mpd.Watcher) {
	for sys := range w.Event {
		fmt.Println(sys)
		notify := make(map[string]interface{})
		notify["act"] = "watcher"
		notify["sys"] = "player"
		c <- notify
	}
}

func responder(c chan map[string]interface{}, ws *websocket.Conn) {
	for {
		response := <-c
		websocket.JSON.Send(ws, &response)
	}
}
 
func main() {
	http.Handle("/", http.FileServer(http.Dir("./")))
	http.Handle("/ws", websocket.Handler(ctrlsocket))
	http.Handle("/stream", http.HandlerFunc(streamproxy))
	http.ListenAndServe(":8080", nil)
}
