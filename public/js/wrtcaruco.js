let config = {
    sdpSemantics: 'unified-plan',
    iceServers: [{urls: ['stun:stun.l.google.com:19302']}]
};

let constraints = {
    //video: true
    video: {
        width: 1920,
        height: 1080,
        facingMode: {
            exact: 'environment'
        }
    }
};

pc = new RTCPeerConnection(config);


pc.addEventListener('track', function(evt) {
    if (evt.track.kind == 'video')
        document.getElementById('webcamresult').srcObject = evt.streams[0];
});

function negotiate() {
    return pc.createOffer().then(function(offer) {
        return pc.setLocalDescription(offer);
    }).then(function() {
        return new Promise(function(resolve) {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            }
            else {
                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        })
    }).then(function() {
        let offer = pc.localDescription;
        console.log(offer.sdp);
        return fetch('https://wrtc.lazzar.one/offer', {
            body: JSON.stringify({
                sdp: offer.sdp,
                type: offer.type,
                video_transform: 'none'
            }),
            headers: {
                'Conter-Type': 'application/json'
            },
            method: 'POST'
        });
    }).then(function(response) {
        return response.json();
    }).then(function(answer) {
        return pc.setRemoteDescription(answer);
    }).catch(function(e) {
        alert(e);
    });
}

navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
        negotiate();
    })
}).catch(e => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
    stream.getTracks().forEach(function(track) {
        pc.addTrack(track, stream);
        negotiate();
    })
})

})
