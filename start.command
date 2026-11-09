#!/bin/bash
# Startet „Nachtwache mit Tanja“ lokal und öffnet sie im Browser.
# Doppelklick genügt. Zum Beenden das Terminalfenster schließen.
cd "$(dirname "$0")"
PORT=8091
echo "Nachtwache mit Tanja läuft auf http://127.0.0.1:$PORT"
echo "Zum Beenden dieses Fenster schließen (oder Ctrl+C)."
( sleep 1; open "http://127.0.0.1:$PORT" ) &
python3 -m http.server $PORT --bind 127.0.0.1
