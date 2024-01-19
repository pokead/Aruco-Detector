# Aruco-Detector
Repo che funziona da archivio per il progetto Aruco-Detector

## Restapi
Al momento è disponibile solo la restapi, dove facendo una richiesta post a /upload con un immagine, essa verrà fatta passare alla libreria ArucoJS e se verranno rilevati codici aruco, verrà restituito un JSON, contenente svariate informazioni, tra cui gli angoli dell'aruco, distanza di hamming e l'id.

Per testare usare il seguente comando curl: 
```curl
curl -F "file=@/path/to/file.jpeg" "http://127.0.0.1:3000/upload"
```