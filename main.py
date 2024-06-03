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
import threading
from loguru import logger

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


streaming_dict = {
    73: "http://195.196.36.242/mjpg/video.mjpg",
}
frame_dict = {}

# parametri detector
params = cv.aruco.DetectorParameters()  
params.minMarkerDistanceRate = 0.05
params.errorCorrectionRate = 0.45

# dizionario aruco
dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_ARUCO_MIP_36H12)

detector = cv.aruco.ArucoDetector(dictionary=dictionary, detectorParams=params)


# capture all the streams inside streaming_dict
# and load the last frame inside frame_dict
def capture_stream(stream_id, url):
    cap = cv.VideoCapture(url)
    if not cap.isOpened():
        print(f"Error opening video stream: {url}")
        return
    while True:
        ret, frame = cap.read()
        if not ret:
            print(f"Failed to grab frame from stream: {url}")
            break
        frame_dict[stream_id] = frame

    cap.release()



def draw_squares(img, corners): # corners = corners[i]
    for corner in range(4):
        img = cv.line(
            img,
            (
                int(corners[0][corner if corner != 3 else 0][0]),
                int(corners[0][corner if corner != 3 else 0][1]),
            ),
            (
                int(corners[0][corner + 1 if corner != 3 else 3][0]),
                int(corners[0][corner + 1 if corner != 3 else 3][1]),
            ),
            (255, 0, 0),
            4,
        )
    return img


def edit_frame(frame, replace, size):
    try:
        imgheight, imgwidth = replace.shape[:2]
    except Exception:
        #logger.exception("Errore nella scelta del replace...")
        replace = frame
        imgheight, imgwidth = replace.shape[:2]
    # rileva gli aruco
    corners, ids, rejected = detector.detectMarkers(frame) 
    if ids is not None:
        for i in range(len(ids)):
            if len(corners) > 0:
                frame = draw_squares(frame, corners[i])
                height, width = frame.shape[:2]

                pts1 = np.float32(
                        [[0, 0], [imgwidth, 0], [0, imgheight], [imgwidth, imgheight]]
                    )
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

                homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC, 5.0)
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
    frame = cv.imencode(".jpg", frame)[1].tobytes()
    return frame

def stream_response(cap = None, replace = None, size = 1, type = "normal"):
    link = replace
    while cap.isOpened():
        ret, frame = cap.read()
        if type == "detect":
            try:
                replace = streaming_dict[link]
            except KeyError as e:
                #logger.exception("a")
                replace = frame
            frame = edit_frame(frame, replace, size)
        else:
            streaming_dict[replace] = frame
            frame = cv.imencode(".jpg", frame)[1].tobytes()
        yield (b"--frame\r\n" b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
    cap.release()


@app.post("/imagearuco/")
async def get_image(file: UploadFile, replace: UploadFile):
    image = io.BytesIO(file.file.read())
    image = open(image)
    nparr = np.array(image)
    frame = nparr
    frame = cv.cvtColor(frame, cv.COLOR_RGB2BGR)
    replace = io.BytesIO(replace.file.read())
    replace = open(replace)
    replace = np.array(replace) 
    replace = cv.cvtColor(replace, cv.COLOR_RGB2BGR)
    frame = edit_frame(frame, replace, 1.5)
    frame = base64.encodebytes(frame)
    frame = b"data:image/png;base64," + frame
    return {"buffer": frame}


@app.post("/image/")
async def get_webcam_frame(request: Request):
    data = await request.json()
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
    frame = edit_frame(frame, replace, size)
    frame = b"data:image/png;base64," + frame
    return {"buffer": frame}


@app.get("/stream/")
async def get_stream(link: str = None, replace: str = None, size: int = 1):
    cap = cv.VideoCapture(link)
    return StreamingResponse(
        stream_response(cap, replace, size, "detect"), media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/startstream/")
async def get_normal_stream(link: str = None):
    global streaming_dict
    streaming_dict[link] = ""
    cap = cv.VideoCapture(link)
    return StreamingResponse(
        stream_response(cap=cap, replace=link, type="normal"), media_type="multipart/x-mixed-replace; boundary=frame"
    )



def main():
    threads = []
    for stream_id, url in streaming_dict.items():
        if stream_id is int:
            thread = threading.Thread(target=capture_stream, args=(stream_id, url))
            threads.append(thread)
            thread.start()
    server.run()
    for thread in threads:
        thread.join()



if __name__ == "__main__":
    main()
