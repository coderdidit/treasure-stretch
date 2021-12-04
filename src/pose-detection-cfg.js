 import * as posedetection from '@tensorflow-models/pose-detection';
 import * as mpPose from '@mediapipe/pose';

const BLAZEPOSE_CONFIG = {
   maxPoses: 1,
   scoreThreshold: 0.65,
   runtime: 'mediapipe',
   modelType: 'full',
   solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
   render3D: false
 };
const MOVENET_CONFIG = {
   maxPoses: 1,
   modelType: posedetection.movenet.modelType.SINGLEPOSE_THUNDER,
   scoreThreshold: 0.3,
   customModel: '',
   enableTracking: false
 };

const moveNetModel = posedetection.SupportedModels.MoveNet
const blazePoseModel = posedetection.SupportedModels.BlazePose

export const modelToCfg = new Map([
  [moveNetModel, MOVENET_CONFIG],
  [blazePoseModel, BLAZEPOSE_CONFIG]
])

// pose detection model config
const modelSet = blazePoseModel
export const PoseDetectionCfg = {
  backend: 'wasm',
  modelConfig: modelToCfg.get(modelSet),
  model: modelSet
}

console.log('PoseDetectionCfg', PoseDetectionCfg)
