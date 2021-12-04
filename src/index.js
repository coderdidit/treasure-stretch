import 'regenerator-runtime/runtime'
import { Camera } from './camera';
import { predict } from './predictions'
import { handleMoveToEvent } from './game-state'
import * as params from './pose-detection-cfg';
import { getAngleBetween } from './angles';
import { left, right, up, stop, down, fire } from './game-state'

const spinner = document.getElementById('spinner')
const welcomBg = document.getElementById('welcom-bg')

const stratSpinner = () => {
    // hide main bg
    welcomBg.style.display = 'none'
    spinner.classList.remove("visually-hidden")
}

const stopSpinner = () => {
    spinner.classList.add("visually-hidden")
}

const startGame = async () => {
    stratSpinner()

    console.log('starting camera setup')
    const camera = await Camera.setupCamera();
    if (camera.video.readyState < 2) {
        await new Promise((resolve) => {
            camera.video.onloadeddata = () => {
                resolve(video);
            };
        });
    }
    console.log('setupCamera finished', camera)

    // un-hide game and camera canvas
    const mainCanvas = document.getElementById('main-canvas')
    mainCanvas.style.display = 'block'
    const videoOutput = document.getElementById('video-output')
    videoOutput.style.display = 'block'

    // ai
    console.log('starting pose prediction')
    predictPose(camera)
}

// TODO implement jump up move after 3 stop, up moves 
let movedUp = false
const handlePoseToGameEvents = (pose) => {
    const poseKeypoints = pose.keypoints

    const nose = poseKeypoints[0]

    const leftEye = poseKeypoints[3]
    const rightEye = poseKeypoints[6]

    const leftShoulder = poseKeypoints[12]
    const rightShoulder = poseKeypoints[11]

    const leftElbow = poseKeypoints[14]
    const rightElbow = poseKeypoints[13]

    // TODO investigate more how this logic works in terms of flipping
    const leftElbowToSholder = getAngleBetween(leftElbow, leftShoulder) * -1
    const rightElbowToSholder = getAngleBetween(rightShoulder, rightElbow)

    const angle = 52

    const bothArmsUp = (leftElbowToSholder > angle)
        && (rightElbowToSholder > angle)

    const moveDown = (leftElbowToSholder > angle
        && rightElbowToSholder < angle) && !bothArmsUp
    const moveUp = (rightElbowToSholder > angle
        && leftElbowToSholder < angle) && !bothArmsUp

    const noseToLeftEyeYdistance = nose.y - leftEye.y
    const noseToRightEyeYdistance = nose.y - rightEye.y

    // vissibility
    const scoreThreshold = params.PoseDetectionCfg.modelConfig.scoreThreshold || 0;

    const noseVissible = nose.score > scoreThreshold
    const lEVissible = leftEye.score > scoreThreshold
    const REVissible = rightEye.score > scoreThreshold

    const moveSideActivationDist = 8
    if (bothArmsUp) {
        return fire
    } else if (noseVissible && lEVissible
        && noseToLeftEyeYdistance < moveSideActivationDist) {
        return left;
    } else if (noseVissible && REVissible
        && noseToRightEyeYdistance < moveSideActivationDist) {
        return right;
    } else if (moveUp) {
        movedUp = true
        return up;
    } else if (moveDown) {
        movedUp = false
        return down;
    } else {
        return stop;
    }
}

// fps for predictions
let fps = 20;
let then = Date.now();
let now, delta;
let interval = 1000 / fps;
let poses

let spinnerStopped = false

const predictPose = async (camera) => {
    requestAnimationFrame(() => {
        predictPose(camera)
    })

    now = Date.now();
    delta = now - then;
    if (delta > interval) {
        then = now - (delta % interval);
        poses = await predict(camera.video)

        if (!spinnerStopped) {
            stopSpinner()
            spinnerStopped = true
        }

        camera.drawCtx()
        if (poses && poses.length > 0) {
            camera.drawResults(poses);
            const pose = poses[0]
            const move = handlePoseToGameEvents(pose)
            handleMoveToEvent(move)
        }
    }
}

const playBtn = document.getElementById('play-btn')
playBtn.addEventListener('click', () => startGame())
