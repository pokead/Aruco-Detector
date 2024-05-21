import io
import cv2 as cv
import numpy as np
from fastapi import FastAPI, Request, APIRouter, Form, UploadFile
from typing import Annotated
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.config import Config
from uvicorn.server import Server
from pydantic import BaseModel
import base64
from PIL import Image
from PIL.Image import frombytes, frombuffer, open


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# configurazione server
server = Server(
    Config(
        app,
        "0.0.0.0",
        8000,
    )
)


streaming_dict = {}

class Image(BaseModel):
    image: str


params = cv.aruco.DetectorParameters()  # parametri vari
params.minMarkerDistanceRate = 0.05
params.errorCorrectionRate = 0.45
# dizionario aruco
dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_ARUCO_MIP_36H12)


# detector aruco
detector = cv.aruco.ArucoDetector(dictionary=dictionary, detectorParams=params)
# immagine da sostituire (ora è commentata perchè ho rimesso la "picture in picture" mode)
# replace = cv.imread("examples/gato.jpeg")
# imgheight, imgwidth = replace.shape[:2]


def get_stream(cap, replace_stream, link, aruco_size):
    while cap.isOpened():
        #print(streaming_dict)
        link = replace_stream
        ret, frame = cap.read()  # prendiamo i singoli frame
        if replace_stream == "normal_stream":
            streaming_dict[link] = frame
        if not ret:
            print("Stream broken")
            break
        new_frame = frame
        try:
            #print(streaming_dict[link])
            if replace_stream != "":
                #print(streaming_dict[link])
                replace = streaming_dict[link]
            #print(link)
            else:
                pass
                #print("mmmm")
                replace = frame
        except Exception as e:
            print("errore: ", e)
            replace = frame
        try:
            imgheight, imgwidth = replace.shape[:2]  # dimensione del frame
        except Exception:
            replace = frame
            imgheight, imgwidth = replace.shape[:2] 
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
                    center = np.mean(pts2, axis=0)
                    translated_matrix = pts2 - center
                    scaled_translated_matrix = translated_matrix * aruco_size
                    pts2 = scaled_translated_matrix + center
                    #print(pts2)
                    #pts2 = pts2 * 2

                    roi_corners2 = np.int32(
                        [
                            corners[i][0][0],
                            corners[i][0][1],
                            corners[i][0][2],
                            corners[i][0][3],
                        ]
                    )
                    center = np.mean(roi_corners2, axis=0)
                    translated_matrix = roi_corners2 - center
                    scaled_translated_matrix = translated_matrix * aruco_size
                    roi_corners2 = scaled_translated_matrix + center
                    roi_corners2 = np.int32(roi_corners2)
                    # qui si entra in teoria della computer vision che non ho nemmeno voglia di leggere
                    homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC, 5.0)
                    # homography = cv.getPerspectiveTransform(pts1, pts2)
                    # creiamo una matrice con i vertici messi in prospettiva per l'immagine
                    warpedMat = cv.warpPerspective(replace, homography, (width, height))
                    mask2 = np.zeros(frame.shape, dtype=np.uint8)
                    #roi_corners2 = np.int32(corners[i][0])
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


def normal_stream(cap, link):
    #print("es")
    while cap.isOpened():
       # print("aaaa")
        ret, frame = cap.read()
        streaming_dict[link] = frame
        frame = cv.imencode(".jpg", frame)[1].tobytes()
        # poi facciamo un bello yield del frame
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")

@app.get("/stream/")
async def video_feed_test(link: str = None, replace: str = None, size: int = 1):
    print(link, replace, size)
    # andrebbero aggiunti controlli più stringenti per esempio una regex per verificare
    # che sia un link effettivamente valido, ma per ora ci va bene così
    if link is None or link == "":
        return "Link invalido"
    #print(link)
    # apriamo con opencv il link
    cap = cv.VideoCapture(link)
    # ritorniamo lo streaming modificato
    return StreamingResponse(
        get_stream(cap, replace, "", size), media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/startstream/")
async def new_stream(link: str = None):
    global streaming_dict
    #data = await request.json()
    #link = data["link"]
    streaming_dict[link] = ""
    cap = cv.VideoCapture(link)
    return StreamingResponse(
        normal_stream(cap, link), media_type="multipart/x-mixed-replace; boundary=frame"
    )
    """ while cap.isOpened():
        ret, frame = cap.read()  # prendiamo i singoli frame
        streaming_dict[link] = frame
        if not ret:
            print("Stream broken")
            break """


@app.post("/image/")
async def image_feed_test(request: Request):
    #if image is None:
    #    return "Immagine non valida"
    data = await request.json()
    
    #print(data)
    #print(data["image"])
    image = data["image"].replace("data:image/jpeg;base64,", "")
    stream = data["replace"]
    size = int(data["size"])
    image = base64.b64decode(image)
    image = io.BytesIO(image)
    image = open(image)
    nparr = np.array(image)
    frame = nparr
    frame = cv.cvtColor(frame, cv.COLOR_RGB2BGR)
    replace = streaming_dict[stream]
    #replace = frame #streaming_dict[stream]
    """ if stream == "":
        replace = frame  # frame per fare la PiP mode
    else:
        replace = frame
        return
        cap = cv.VideoCapture(stream)
        if cap.isOpened():
            ret, stream_frame = cap.read()  # prendiamo i singoli frame
            if not ret:
                print("Stream broken")
                cap.release()
                return
            replace = stream_frame
            cap.release() """
    try:
        imgheight, imgwidth = replace.shape[:2]  # dimensione del frame
    except Exception:
        replace = frame
        imgheight, imgwidth = replace.shape[:2]
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
                print(corners[i][0][0] * 10)
                pts2 = np.float32(
                    [
                        corners[i][0][0],
                        corners[i][0][1],
                        corners[i][0][3],
                        corners[i][0][2],
                    ]
                )
                
                center = np.mean(pts2, axis=0)
                translated_matrix = pts2 - center
                scaled_translated_matrix = translated_matrix * size
                pts2 = scaled_translated_matrix + center

                roi_corners2 = np.int32(
                    [
                        corners[i][0][0],
                        corners[i][0][1],
                        corners[i][0][2],
                        corners[i][0][3],
                    ]
                )
                center = np.mean(roi_corners2, axis=0)
                translated_matrix = roi_corners2 - center
                scaled_translated_matrix = translated_matrix * size
                roi_corners2 = scaled_translated_matrix + center
                roi_corners2 = np.int32(roi_corners2)
                # qui si entra in teoria della computer vision che non ho nemmeno voglia di leggere
                homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC, 5.0)
                
                #cv.resize(homography, ())
                # homography = cv.getPerspectiveTransform(pts1, pts2)
                # creiamo una matrice con i vertici messi in prospettiva per l'immagine
                #warpedMat = cv.warpPerspective(replace, homography, (width, height), dst=frame)
                #cv.imwrite("warped.jpg", warpedMat)
                warpedMat = cv.warpPerspective(replace, homography, (width, height))
                #cv.imwrite("warped.jpg", warpedMat)
                #warpedMat = cv.resize(warpedMat, (0,0), fx=2, fy=2)
                #cv.imwrite("test.jpg", test)
                #print(frame.shape)
                mask2 = np.zeros(frame.shape, dtype=np.uint8)
                channel_count2 = frame.shape[2]
                ignore_mask_color2 = (255,) * channel_count2
                # creiamo una figura nera sull'aruco perchè con opencv non è direttamente piazzabile un'immagine sopra un'altra
                cv.fillConvexPoly(mask2, roi_corners2, ignore_mask_color2)
                # con operazioni bit a bit in qualche modo si rimpiazza la figura nera con la nostra immagine
                mask2 = cv.bitwise_not(mask2)
                masked_image2 = cv.bitwise_and(frame, mask2)
                frame = cv.bitwise_or(warpedMat, masked_image2)
    frame = cv.imencode(".jpg", frame)[1].tobytes()
    frame = base64.encodebytes(frame)
    frame = b"data:image/png;base64," + frame
    return {"buffer": frame}
    #return frame
    #return Response(content=frame, media_type="image/jpeg")
    #print("Received image")
    #image = base64.b64decode(data["image"])
    #
    #nparr = np.frombuffer(image, np.uint8)
    #nparr = cv.imencode(".jpg", nparr)[1].tobytes()
    #nparr = np.fromstring(nparr, np.uint8)
    #nparr = cv.imdecode(nparr, cv.IMREAD_COLOR)
    #
    ##nparr = cv.imdecode(nparr, cv.IMREAD_COLOR)
    #cv.imshow("Image", nparr)
    #cv.waitKey(0)
    #cv.destroyAllWindows()
    #
    #print(nparr)


@app.post("/imagearuco/")
async def image_aruco(file: UploadFile, file1: UploadFile):
    image = io.BytesIO(file.file.read())
    image = open(image)
    nparr = np.array(image)
    frame = nparr
    frame = cv.cvtColor(frame, cv.COLOR_RGB2BGR)
    replace = io.BytesIO(file1.file.read())
    replace = open(replace)
    replace = np.array(replace) 
    replace = cv.cvtColor(replace, cv.COLOR_RGB2BGR)
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
                #print(corners[i][0][0] * 10)
                pts2 = np.float32(
                    [
                        corners[i][0][0],
                        corners[i][0][1],
                        corners[i][0][3],
                        corners[i][0][2],
                    ]
                )
                print(pts2)
                center = np.mean(pts2, axis=0)
                translated_matrix = pts2 - center
                scaled_translated_matrix = translated_matrix * 1.5
                pts2 = scaled_translated_matrix + center
                print(pts2)
                roi_corners2 = np.int32(
                    [
                        corners[i][0][0],
                        corners[i][0][1],
                        corners[i][0][2],
                        corners[i][0][3],
                    ]
                )
                center = np.mean(roi_corners2, axis=0)
                translated_matrix = roi_corners2 - center
                scaled_translated_matrix = translated_matrix * 1.5
                roi_corners2 = scaled_translated_matrix + center
                roi_corners2 = np.int32(roi_corners2)

                # qui si entra in teoria della computer vision che non ho nemmeno voglia di leggere
                homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC, 5.0)
                #cv.resize(homography, ())
                # homography = cv.getPerspectiveTransform(pts1, pts2)
                # creiamo una matrice con i vertici messi in prospettiva per l'immagine
                warpedMat = cv.warpPerspective(replace, homography, (width, height))
                #print(frame.shape)
                mask2 = np.zeros(frame.shape, dtype=np.uint8)
                #roi_corners2 = np.int32(corners[i][0])
                channel_count2 = frame.shape[2]
                ignore_mask_color2 = (255,) * channel_count2
                # creiamo una figura nera sull'aruco perchè con opencv non è direttamente piazzabile un'immagine sopra un'altra
                cv.fillConvexPoly(mask2, roi_corners2, ignore_mask_color2)
                # con operazioni bit a bit in qualche modo si rimpiazza la figura nera con la nostra immagine
                mask2 = cv.bitwise_not(mask2)
                masked_image2 = cv.bitwise_and(frame, mask2)
                frame = cv.bitwise_or(warpedMat, masked_image2)
    frame = cv.imencode(".jpg", frame)[1].tobytes()
    frame = base64.encodebytes(frame)
    frame = b"data:image/png;base64," + frame
    return {"buffer": frame}




# creare una funzione che legge lo streaming, butta l'ultimo frame in una global var e dall'endpoint image uso quella global var come replace

@app.post("/test")
async def test(request: Request):

    return {"message": "test"}

# eseguiamo il server
server.run()
