import cv2 as cv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from uvicorn.config import Config
from uvicorn.server import Server
import numpy as np


app = FastAPI()


server = Server(
    Config(
        app,
        "0.0.0.0",
        8000,
    )
)

params = cv.aruco.DetectorParameters()
params.minMarkerDistanceRate = 0.025
params.errorCorrectionRate = 0.6
dictionary = cv.aruco.getPredefinedDictionary(cv.aruco.DICT_ARUCO_MIP_36H12)
detector = cv.aruco.ArucoDetector(dictionary=dictionary, detectorParams=params)
img = cv.imread("examples/gato.jpeg")


imgheight, imgwidth = img.shape[:2]



def get_stream(cap):
    while cap.isOpened():
        ret, frame = cap.read() 
        if not ret:
            print("Stream broken")
            break
        new_frame = frame
        corners, ids, rejected = detector.detectMarkers(frame)
        if ids is not None:
            for i in range(len(ids)):
                if len(corners) != 0:
                    for corner in range(4):
                        new_frame = cv.line(
                        new_frame,
                        (int(corners[i][0][corner if corner != 3 else 0][0]), int(corners[i][0][corner if corner != 3 else 0][1])), 
                        (int(corners[i][0][corner+1 if corner != 3 else 3][0]), int(corners[i][0][corner+1 if corner != 3 else 3][1])),
                        (255,0,0),
                        4
                        )
                    height, width = new_frame.shape[:2]
                    pts1 = np.float32([[0,0],[imgwidth,0], [0, imgheight], [imgwidth,imgheight]])
                    pts2 = np.float32(
                        [corners[i][0][0],
                        corners[i][0][1],
                        corners[i][0][3],
                        corners[i][0][2]]
                    )
                    homography, mask = cv.findHomography(pts1, pts2, cv.RANSAC,5.0)
                    #homography = cv.getPerspectiveTransform(pts1, pts2)
                    im1Reg = cv.warpPerspective(img, homography, (width, height))
                    mask2 = np.zeros(new_frame.shape, dtype=np.uint8)
                    roi_corners2 = np.int32(corners[i][0])
                    channel_count2 = new_frame.shape[2]  
                    ignore_mask_color2 = (255,)*channel_count2
                    cv.fillConvexPoly(mask2, roi_corners2, ignore_mask_color2)
                    mask2 = cv.bitwise_not(mask2)
                    masked_image2 = cv.bitwise_and(new_frame, mask2)
                    new_frame = cv.bitwise_or(im1Reg, masked_image2)
        new_frame = cv.imencode('.jpg', new_frame)[1].tobytes()
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + new_frame + b'\r\n')
        


@app.get("/stream/")
async def video_feed_test(link: str = None):
    if link is None or link == "":
        return "Link invalido"
    print(link)
    cap = cv.VideoCapture(link)
    return StreamingResponse(get_stream(cap), media_type="multipart/x-mixed-replace; boundary=frame")


async def main():
    server.run()

if __name__ == "__main__":
    try:
        server.run()
    except KeyboardInterrupt:
        print("Bot stopped")
        server.should_exit = True
        server.force_exit = True
        server.handle_exit(None, None)

