document.addEventListener('DOMContentLoaded', () => {
    // Referenzen zu den HTML-Elementen erhalten
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const snapButton = document.getElementById('snap');
    const saveButton = document.getElementById('save');
    const backButton = document.getElementById('back');
    const photo = document.getElementById('photo');
    const context = canvas.getContext('2d');
    const countdownDisplay = document.getElementById('countdown'); 

    // Zugriff auf die Webcam anfordern und das Video-Element mit dem Webcam-Stream verbinden
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
        }
    })
    .then((stream) => {
        video.srcObject = stream;
    })
    .catch((err) => {
        console.error("Fehler beim Zugriff auf die Kamera: ", err);
    });

    // Foto aufnehmen mit Timer
    snapButton.addEventListener('click', () => {
        // Countdown-Anzeige
        let countdown = 5; // Countdown-Zeit in Sekunden
        countdownDisplay.textContent = countdown;
        countdownDisplay.style.display = 'block';

        // Countdown-Funktion
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownDisplay.textContent = countdown;
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                countdownDisplay.style.display = 'none';

                // Foto aufnehmen
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                context.drawImage(video, 0, 0, videoWidth, videoHeight);
                const dataURL = canvas.toDataURL('image/png');
                if (photo.src !== dataURL) {
                    photo.src = dataURL;
                    photo.alt = "Dein geschossenes Foto";
                }
                // Element, zu dem gescrollt werden soll
                const vorschauElement = document.getElementById('vorschau');
                // Fokus auf das Element mit der ID 'vorschau' setzen
                vorschauElement.scrollIntoView({ behavior: 'instant' });
            }
        }, 1000);
    });

    // WebSocket-Verbindung zum Python-Server herstellen
    const socket = new WebSocket('ws://localhost:8765');

    // Nachricht vom WebSocket-Server empfangen
    socket.addEventListener('message', function(event) {
        const key = event.data;
        console.log(`Received key: ${key}`);
        if (key === 'c') {
            snapButton.click();
        } else if (key === 's') {
            saveButton.click();
        }
    });

    // Hilfsausgaben zum Debuggen
    socket.addEventListener('open', function(event) {
        console.log('WebSocket connection opened');
    });

    socket.addEventListener('close', function(event) {
        console.log('WebSocket connection closed');
    });

    socket.addEventListener('error', function(event) {
        console.error('WebSocket error:', event);
    });

    // Foto speichern und Dateinamen an den WebSocket-Server senden
    saveButton.addEventListener('click', () => {
        if (photo.src) {
            const dataURL = canvas.toDataURL('image/png');
            const blob = dataURLToBlob(dataURL);
            const timestamp = generateTimestamp();
            const fileName = `foto_${timestamp}.png`;

            // Sende den Dateinamen an den WebSocket-Server
            socket.send(fileName);

            saveAs(blob, fileName);
        } else {
            alert("Bitte zuerst ein Foto aufnehmen.");
        }
    });

    // Hilfsfunktion, um eine Data URL in ein Blob-Objekt zu konvertieren
    function dataURLToBlob(dataURL) {
        const byteString = atob(dataURL.split(',')[1]);
        const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    // Zeitstempel im gewünschten Format generieren (yyyy.mm.dd hh_mm_ss_msms)
    function generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = ('0' + (now.getMonth() + 1)).slice(-2);
        const day = ('0' + now.getDate()).slice(-2);
        const hours = ('0' + now.getHours()).slice(-2);
        const minutes = ('0' + now.getMinutes()).slice(-2);
        const seconds = ('0' + now.getSeconds()).slice(-2);
        const milliseconds = ('00' + now.getMilliseconds()).slice(-3);
        return `${day}.${month}.${year} ${hours}_${minutes}_${seconds}_${milliseconds}`;
    }

    // Tastenereignisse verarbeiten
    document.addEventListener('keydown', function(event) {
        if (event.key === 'c' || event.key === 'C') {
            snapButton.click();
        } else if (event.key === 's' || event.key === 'S') {
            saveButton.click();
        } else if (event.key === 'Escape') {
            backButton.click();
        }
    });
});
