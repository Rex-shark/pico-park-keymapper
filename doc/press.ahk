#NoTrayIcon
SendMode "Play"          ; 你指定要用 Play 模式
SetKeyDelay 0, 50        ; 每個按鍵事件之間延遲 50ms

key := A_Args[1]

; 發送前先稍微等一下，避免太快被遊戲忽略
Sleep 30

; 為了方便修改，統一用一個變數存要送出的鍵名稱（AutoHotkey 特殊鍵名稱）
sendKey := ""

if (key = "Left") {
    sendKey := "Left"
} else if (key = "Right") {
    sendKey := "Right"
} else if (key = "Up") {
    sendKey := "Up"
} else if (key = "Down") {
    sendKey := "Down"
} else if (key = "Z") {
    sendKey := "z"
} else if (key = "X") {
    sendKey := "x"
} else if (key = "A") {
    sendKey := "a"
} else if (key = "D") {
    sendKey := "d"
} else if (key = "W") {
    sendKey := "w"
} else if (key = "S") {
    sendKey := "s"
} else if (key = "J") {
    sendKey := "j"
} else if (key = "K") {
    sendKey := "k"
}

; 若有對應到按鍵，則用 down/up+Sleep 的方式送出
if (sendKey != "") {
    ; key down
    Send "{" . sendKey . " down}"
    Sleep 10              ; 這裡就是你說的“增加一點延遲”，要更長就改這個數字，例如 20/30
    ; key up
    Send "{" . sendKey . " up}"
}

ExitApp
