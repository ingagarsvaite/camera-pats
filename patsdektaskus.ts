<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Angle Measurement App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #camera-container {
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        #camera-view {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        #overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .point {
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: red;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: all;
            cursor: move;
        }
        .point.selected {
            border: 2px solid yellow;
        }
        .point::after {
            content: attr(data-label);
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 12px;
        }
        .line {
            position: absolute;
            background-color: rgba(255, 255, 0, 0.7);
            height: 2px;
            transform-origin: 0 0;
            pointer-events: none;
        }
        .controls {
            padding: 10px;
            background-color: #333;
            color: white;
            display: flex;
            justify-content: space-around;
        }
        button {
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:disabled {
            background-color: #cccccc;
        }
        #data-display {
            padding: 10px;
            background-color: #eee;
            max-height: 150px;
            overflow-y: auto;
        }
        .angle-display {
            margin: 5px 0;
            padding: 5px;
            background-color: #ddd;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="camera-container">
            <video id="camera-view" autoplay playsinline></video>
            <canvas id="overlay"></canvas>
        </div>
        <div id="data-display">
            <h3>Measurements</h3>
            <div id="measurements-list"></div>
        </div>
        <div class="controls">
            <button id="start-btn">Start Recording (1-2s)</button>
            <button id="add-point-btn">Add Point</button>
            <button id="delete-point-btn">Delete Selected</button>
            <button id="clear-all-btn">Clear All</button>
            <button id="save-btn">Save Data</button>
        </div>
    </div>

    <script>
        // App state
        const state = {
            points: [],
            selectedPoint: null,
            isRecording: false,
            recordedData: [],
            pointCounter: 1
        };

        // DOM elements
        const cameraView = document.getElementById('camera-view');
        const overlay = document.getElementById('overlay');
        const startBtn = document.getElementById('start-btn');
        const addPointBtn = document.getElementById('add-point-btn');
        const deletePointBtn = document.getElementById('delete-point-btn');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const saveBtn = document.getElementById('save-btn');
        const measurementsList = document.getElementById('measurements-list');
        const ctx = overlay.getContext('2d');

        // Initialize camera
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                cameraView.srcObject = stream;
                
                // Set canvas size to match video
                cameraView.addEventListener('loadedmetadata', () => {
                    overlay.width = cameraView.videoWidth;
                    overlay.height = cameraView.videoHeight;
                });
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Cannot access camera: ' + err.message);
            }
        }

        // Add point at center of screen
        addPointBtn.addEventListener('click', () => {
            const x = overlay.width / 2;
            const y = overlay.height / 2;
            addPoint(x, y);
        });

        // Add point function
        function addPoint(x, y) {
            const point = {
                id: Date.now(),
                x,
                y,
                label: `P${state.pointCounter++}`
            };
            
            state.points.push(point);
            drawPointsAndLines();
            calculateAngles();
        }

        // Draw points and connecting lines
        function drawPointsAndLines() {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            
            // Draw lines between points
            if (state.points.length > 1) {
                for (let i = 0; i < state.points.length - 1; i++) {
                    const p1 = state.points[i];
                    const p2 = state.points[i + 1];
                    
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
            
            // Draw points
            state.points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = point === state.selectedPoint ? 'yellow' : 'red';
                ctx.fill();
                
                // Draw label
                ctx.font = '14px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(point.label, point.x, point.y - 15);
            });
        }

        // Calculate angles between points
        function calculateAngles() {
            measurementsList.innerHTML = '';
            
            if (state.points.length < 3) return;
            
            for (let i = 1; i < state.points.length - 1; i++) {
                const p1 = state.points[i - 1];
                const p2 = state.points[i];
                const p3 = state.points[i + 1];
                
                // Calculate vectors
                const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
                const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
                
                // Calculate angle
                const dot = v1.x * v2.x + v1.y * v2.y;
                const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                const angleRad = Math.acos(dot / (mag1 * mag2));
                const angleDeg = angleRad * (180 / Math.PI);
                
                // Display angle
                const angleElement = document.createElement('div');
                angleElement.className = 'angle-display';
                angleElement.textContent = `Angle at ${p2.label}: ${angleDeg.toFixed(2)}°`;
                measurementsList.appendChild(angleElement);
                
                // Record if we're in recording mode
                if (state.isRecording) {
                    state.recordedData.push({
                        timestamp: Date.now(),
                        points: [...state.points],
                        angle: angleDeg,
                        anglePoint: p2.label
                    });
                }
            }
        }

        // Start recording for 1 second
        startBtn.addEventListener('click', async () => {
            state.isRecording = true;
            state.recordedData = [];
            startBtn.disabled = true;
            startBtn.textContent = 'Recording...';
            
            // Record for 1 second (from 1s to 2s)
            setTimeout(() => {
                state.isRecording = false;
                startBtn.disabled = false;
                startBtn.textContent = 'Start Recording (1-2s)';
                alert(`Recorded ${state.recordedData.length} measurements`);
            }, 1000);
        });

        // Save data function
        saveBtn.addEventListener('click', () => {
            if (state.recordedData.length === 0) {
                alert('No data to save. Record some measurements first.');
                return;
            }
            
            const dataStr = JSON.stringify(state.recordedData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `angle-measurements-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            link.click();
        });

        // Delete selected point
        deletePointBtn.addEventListener('click', () => {
            if (state.selectedPoint) {
                const index = state.points.indexOf(state.selectedPoint);
                if (index > -1) {
                    state.points.splice(index, 1);
                    state.selectedPoint = null;
                    drawPointsAndLines();
                    calculateAngles();
                }
            }
        });

        // Clear all points
        clearAllBtn.addEventListener('click', () => {
            state.points = [];
            state.selectedPoint = null;
            state.pointCounter = 1;
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            measurementsList.innerHTML = '';
        });

        // Handle canvas clicks to select/move points
        overlay.addEventListener('click', (e) => {
            const rect = overlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if clicked on a point
            for (const point of state.points) {
                const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
                if (distance <= 10) {
                    state.selectedPoint = point;
                    drawPointsAndLines();
                    return;
                }
            }
            
            // If not clicked on a point, add a new one
            addPoint(x, y);
        });

        // Initialize the app
        initCamera();
    </script>
</body>
</html>