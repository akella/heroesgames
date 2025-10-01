uniform sampler2D depthTexture;
uniform sampler2D layerTex;
uniform sampler2D maskTex;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float parallaxStrength;
uniform float enabled;
uniform float time;
uniform float opacity;
uniform int maskChannel; // 0=r 1=g 2=b 3=a
uniform vec2 bboxMin;
uniform vec2 bboxSize;
uniform float depthAspect;
varying vec2 vUv;

void main(){
  float screenAspect = resolution.x / resolution.y;
  vec2 newUV = vUv;
  if(depthAspect > screenAspect){
    newUV.x = (vUv.x - 0.5) * screenAspect / depthAspect + 0.5;
  } else {
    newUV.y = (vUv.y - 0.5) * depthAspect / screenAspect + 0.5;
  }
  float depth = texture2D(depthTexture, newUV).r;
  vec2 offset = (mouse - 0.5) * 0.5;
  vec2 parallaxUV = newUV - offset * depth * parallaxStrength;
  // Clamp parallaxUV to avoid sampling outside when mouse is at extremes
  parallaxUV = clamp(parallaxUV, vec2(0.0), vec2(1.0));
  // Local UV remap for layer texture based on mask bounding box
  vec2 localUV = (parallaxUV - bboxMin) / bboxSize; // reverted: no additional aspect scaling
  // Clamp localUV to avoid black edges when bbox is near border
  localUV = clamp(localUV, vec2(0.0), vec2(1.0));
  vec4 col = texture2D(layerTex, localUV);
  vec4 mS = texture2D(maskTex, parallaxUV);
  float m = (maskChannel==0)?mS.r: (maskChannel==1)?mS.g: (maskChannel==2)?mS.b: mS.a;
  col.rgb *= col.a; // premult
  col *= m * enabled;
  col.a *= opacity;
  gl_FragColor = col;
}
