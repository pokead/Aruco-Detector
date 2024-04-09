import cv2 as cv
import numpy as np
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from uvicorn.config import Config
from uvicorn.server import Server


app = FastAPI()

# configurazione server
server = Server(
    Config(
        app,
        "0.0.0.0",
        8000,
    )
)

params = cv.aruco.DetectorParameters()  # parametri vari
params.minMarkerDistanceRate = 0.025
params.errorCorrectionRate = 0.6
# dizionario aruco
dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_ARUCO_MIP_36H12)


# detector aruco
detector = cv.aruco.ArucoDetector(dictionary=dictionary, detectorParams=params)
# immagine da sostituire (ora è commentata perchè ho rimesso la "picture in picture" mode)
# replace = cv.imread("examples/gato.jpeg")
# imgheight, imgwidth = replace.shape[:2]


def get_stream(cap):
    while cap.isOpened():
        ret, frame = cap.read()  # prendiamo i singoli frame
        if not ret:
            print("Stream broken")
            break
        new_frame = frame
        replace = frame  # frame per fare la PiP mode
        imgheight, imgwidth = replace.shape[:2]  # dimensione del frame
        corners, ids, rejected = detector.detectMarkers(frame)  # vertici, id
        if ids is not None:  # se la variabile ids è none significa che non è stato trovato nessun aruco valido
            for i in range(len(ids)):
                if len(corners) != 0:
                    for corner in range(4):
                        # disegna il quadrato sull'aruco (in modi molto discutibili)
                        frame = cv.line(
                            frame,
                            (
                                int(corners[i][0][corner if corner != 3 else 0][0]),
                                int(corners[i][0][corner if corner != 3 else 0][1]),
                            ),
                            (
                                int(corners[i][0][corner + 1 if corner != 3 else 3][0]),
                                int(corners[i][0][corner + 1 if corner != 3 else 3][1]),
                            ),
                            (255, 0, 0),
                            4,
                        )
                    # dimensioni del frame effettivo da visualizzare
                    height, width = frame.shape[:2]
                    # vertici immagine / frame su che rimpiazza l'aruco
                    pts1 = np.float32(
                        [[0, 0], [imgwidth, 0], [0, imgheight], [imgwidth, imgheight]]
                    )
                    # vertici aruco
                    pts2 = np.float32(
                        [
                            corners[i][0][0],
                            corners[i][0][1],
                            corners[i][0][3],
                            corners[i][0][2],
                        ]
                    )
                    # qui si entra in teoria della computer vision che non ho nemmeno voglia di leggere
                    homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC, 5.0)
                    # homography = cv.getPerspectiveTransform(pts1, pts2)
                    # creiamo una matrice con i vertici messi in prospettiva per l'immagine
                    warpedMat = cv.warpPerspective(replace, homography, (width, height))
                    mask2 = np.zeros(frame.shape, dtype=np.uint8)
                    roi_corners2 = np.int32(corners[i][0])
                    channel_count2 = frame.shape[2]
                    ignore_mask_color2 = (255,) * channel_count2
                    # creiamo una figura nera sull'aruco perchè con opencv non è direttamente piazzabile un'immagine sopra un'altra
                    cv.fillConvexPoly(mask2, roi_corners2, ignore_mask_color2)
                    # con operazioni bit a bit in qualche modo si rimpiazza la figura nera con la nostra immagine
                    mask2 = cv.bitwise_not(mask2)
                    masked_image2 = cv.bitwise_and(frame, mask2)
                    frame = cv.bitwise_or(warpedMat, masked_image2)
        # encodiamo il frame in jpg e poi lo trasformiamo in bytes
        frame = cv.imencode(".jpg", frame)[1].tobytes()
        # poi facciamo un bello yield del frame
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")


@app.get("/stream/")
async def video_feed_test(link: str = None):
    # andrebbero aggiunti controlli più stringenti per esempio una regex per verificare
    # che sia un link effettivamente valido, ma per ora ci va bene così
    if link is None or link == "":
        return "Link invalido"
    print(link)
    # apriamo con opencv il link
    cap = cv.VideoCapture(link)
    # ritorniamo lo streaming modificato
    return StreamingResponse(
        get_stream(cap), media_type="multipart/x-mixed-replace; boundary=frame"
    )


# eseguiamo il server
server.run()
